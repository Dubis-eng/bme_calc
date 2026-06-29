📥 1. Para fazer o Backup do Banco (Sem corromper acentos):
Execute estes dois comandos no seu terminal:

powershell
# 1. Executa o backup salvando o arquivo dentro do próprio container (onde o encoding é UTF-8 nativo)
docker compose exec db pg_dump -U uisa_user -F c -b -v -f /tmp/backup.dump bme_calc
# 2. Copia o arquivo gerado de dentro do container para a sua pasta local
docker compose cp db:/tmp/backup.dump ./backup.dump
Por que isso é melhor? Usamos o formato customizado do Postgres (-F c), que gera um arquivo binário compactado (backup.dump) em vez de um arquivo .sql de texto puro. Esse formato binário preserva o banco perfeitamente e é o padrão profissional para backups do PostgreSQL.

📤 2. Para Restaurar o Banco a partir desse backup:
Se um dia precisar restaurar este backup em um banco limpo:

powershell
# 1. Copia o arquivo de backup da sua máquina para dentro do container do banco
docker compose cp ./backup.dump db:/tmp/backup.dump
# 2. Executa a restauração (utilizando pg_restore para o formato binário)
docker compose exec db pg_restore -U uisa_user -d bme_calc --clean --no-owner /tmp/backup.dump