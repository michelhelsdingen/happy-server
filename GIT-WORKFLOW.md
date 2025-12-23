# Git Workflow - Happy Server Fork

## Repository Setup

| Remote | Repository | Doel |
|--------|------------|------|
| `origin` | `michelhelsdingen/happy-server` | Jouw fork - hier push je naar |
| `upstream` | `slopus/happy-server` | Origineel - hier haal je updates van |

## Dagelijks Gebruik

### Je eigen wijzigingen pushen

```bash
git add .
git commit -m "Beschrijving van je wijziging"
git push origin main
```

### Updates van de originele devs ophalen

```bash
# 1. Haal de laatste wijzigingen op
git fetch upstream

# 2. Bekijk wat er nieuw is (optioneel)
git log HEAD..upstream/main --oneline

# 3. Merge de updates in jouw code
git merge upstream/main

# 4. Los eventuele merge conflicts op, dan:
git push origin main
```

## Handige Commands

```bash
# Bekijk je remotes
git remote -v

# Bekijk status
git status

# Bekijk verschil met upstream
git diff upstream/main
```

## Bij Merge Conflicts

Als je code botst met updates van upstream:

1. Git toont welke bestanden conflicteren
2. Open de bestanden en kies welke code je wilt houden
3. Verwijder de conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
4. `git add .` en `git commit`

## Links

- Jouw fork: https://github.com/michelhelsdingen/happy-server
- Origineel: https://github.com/slopus/happy-server
