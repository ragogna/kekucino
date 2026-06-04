$key = Read-Host -Prompt "Incolla chiave Gemini"
if ($key.Length -lt 10) { Write-Host "Chiave troppo corta"; exit 1 }
vercel env rm GEMINI_API_KEY production --yes
vercel env add GEMINI_API_KEY production --value $key --yes --no-sensitive
Write-Host "Fatto. Lunghezza chiave: $($key.Length)"
