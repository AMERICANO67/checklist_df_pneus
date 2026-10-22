@echo off
set PROJECT_DIR=c:\Users\Fernando\Desktop\checklist_df_pneus
powershell -NoProfile -ExecutionPolicy Bypass -Command "Continue='SilentlyContinue'; try { Invoke-WebRequest -UseBasicParsing 'http://localhost:5500/checklist_df_pneus.html' | Out-Null } catch { Start-Process -WindowStyle Hidden -FilePath python -ArgumentList '-m','http.server','5500' -WorkingDirectory 'c:\Users\Fernando\Desktop\checklist_df_pneus'; Start-Sleep -Milliseconds 1500 }; Start-Process 'http://localhost:5500/checklist_df_pneus.html'"
