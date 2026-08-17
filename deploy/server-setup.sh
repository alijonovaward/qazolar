#!/usr/bin/env bash
# QazoNamoz — production serverga BIR MARTA joylashtirish uchun qo'llanma/skript.
#
# Bu server bir nechta boshqa loyihani ham xizmat qiladi (bitta umumiy
# tizim-darajasidagi Nginx, /etc/nginx/sites-available/ naqshida). Shu sabab
# QazoNamoz'ning Docker Nginx'i to'g'ridan-to'g'ri 80-portga chiqmaydi —
# faqat 127.0.0.1:8090'ga bog'lanadi (docker-compose.prod.yml'da sozlangan),
# tizim Nginx'i esa boshqa loyihalar kabi shu portga yo'naltiradi.
#
# Ishlatish: skriptni bosqichma-bosqich, tekshirib turib bajaring — bir
# butun avtomat sifatida emas (ayniqsa .env, DNS, certbot qadamlari qo'lda
# tasdiqlashni talab qiladi).

set -euo pipefail

DOMAIN="qazolar.uz"
WWW_DOMAIN="www.qazolar.uz"
APP_DIR="/home/qazolar"
INTERNAL_PORT="8090"   # docker-compose.prod.yml'dagi bilan bir xil bo'lishi kerak
REPO_URL="https://github.com/alijonovaward/qazolar.git"

echo "=== 1. Docker o'rnatish ==="
apt update
apt install -y docker.io docker-compose-v2
systemctl enable --now docker

echo "=== 2. Repo clone ==="
if [ -d "$APP_DIR" ]; then
  echo "$APP_DIR allaqachon bor — 'git pull' bilan yangilanadi deb hisoblanadi, o'tkazib yuboriladi."
else
  git clone "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"

echo "=== 3. .env ==="
if [ ! -f .env ]; then
  cp .env.prod.example .env
  echo ">>> .env yaratildi namunadan. HOZIR TO'XTATING va quyidagilarni to'ldiring:"
  echo "    - DJANGO_SECRET_KEY (masalan: python3 -c \"import secrets; print(secrets.token_urlsafe(50))\")"
  echo "    - POSTGRES_PASSWORD (kuchli parol)"
  echo "    nano $APP_DIR/.env"
  exit 0
fi

echo "=== 4. Build va ishga tushirish ==="
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend python manage.py migrate
echo ">>> Admin hisobini yaratish uchun qo'lda ishga tushiring:"
echo "    docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend python manage.py createsuperuser"

echo "=== 5. Ichki portni tekshirish ==="
sleep 3
curl -fsS -o /dev/null -w "127.0.0.1:${INTERNAL_PORT} -> HTTP %{http_code}\n" "http://127.0.0.1:${INTERNAL_PORT}/" || \
  echo "!!! Ichki port javob bermayapti — 'docker compose ... logs nginx' bilan tekshiring."

cat << EOF

=== 6. DNS (qo'lda, domen provayderingizda) ===
${DOMAIN} va ${WWW_DOMAIN} uchun A-yozuvni shu serverning IP'siga yo'naltiring.
Tarqalganini tekshiring: dig ${DOMAIN} +short

=== 7. Tizim Nginx sayti ===
Quyidagi kontentni /etc/nginx/sites-available/${DOMAIN} ga yozing:

server {
    listen 80;
    server_name ${DOMAIN} ${WWW_DOMAIN};
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:${INTERNAL_PORT};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

Keyin:
    ln -s /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx

=== 8. SSL (DNS tarqalgandan keyin) ===
    certbot --nginx -d ${DOMAIN} -d ${WWW_DOMAIN}

Shundan keyin https://${DOMAIN} ochilishi kerak.
EOF
