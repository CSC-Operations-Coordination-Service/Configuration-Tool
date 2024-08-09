For dump DB:
    /usr/bin/pg_dump --clean --if-exists --file "/tmp/configuration_tool_backup.sql" --host "localhost" --port "5432" --username "configuration_tool" --no-password --verbose --format=p "configuration_tool_db"
For restore DB:
    /usr/bin/psql --file "/tmp/configuration_tool_backup.sql" --host "localhost" --port "5432" --username "configuration_tool" --no-password "configuration_tool_db"