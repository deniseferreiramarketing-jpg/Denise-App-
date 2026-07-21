@echo off
chcp 65001 >nul
echo Removendo rotas antigas que causam erro 500...
if exist "api\clientes" rmdir /s /q "api\clientes"
if exist "lib" rmdir /s /q "lib"
echo.
echo Limpeza concluida.
echo Confirme no GitHub Desktop que api/clientes e lib aparecem como excluidos.
pause
