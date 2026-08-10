import subprocess
import re
import json
import html

def fetch_url(url):
    cmd = ['curl', '-s', '-k', '-c', 'cookies.txt', '-b', 'cookies.txt', '-L', url]
    return subprocess.run(cmd, stdout=subprocess.PIPE, text=True, errors='ignore').stdout

# 1. Target competitions
target_competitions = [
    {'name': 'DIVISIÓN HONOR CADETE', 'id': '23183313', 'cat': 'Cadete', 'sub': 'SUB16'},
    {'name': 'CADETE AUTONÓMICA', 'id': '23185096', 'cat': 'Cadete', 'sub': 'SUB16'},
    {'name': 'CADETE PREFERENTE', 'id': '23183325', 'cat': 'Cadete', 'sub': 'SUB15'},
    {'name': 'DIVISIÓN HONOR INFANTIL', 'id': '23183315', 'cat': 'Infantil', 'sub': 'SUB14'},
    {'name': 'INFANTIL AUTONÓMICA', 'id': '23185097', 'cat': 'Infantil', 'sub': 'SUB14'},
    {'name': 'INFANTIL PREFERENTE', 'id': '23183329', 'cat': 'Infantil', 'sub': 'SUB13'},
    {'name': 'ALEVÍN PREFERENTE', 'id': '23183336', 'cat': 'Alevín', 'sub': 'SUB12'},
    {'name': 'PRIMERA ALEVÍN', 'id': '23183338', 'cat': 'Alevín', 'sub': 'SUB11'},
    {'name': 'BENJAMÍN PREFERENTE', 'id': '23183341', 'cat': 'Benjamín', 'sub': 'SUB10'},
    {'name': 'PRIMERA BENJAMÍN', 'id': '23183343', 'cat': 'Benjamín', 'sub': 'SUB9'},
]

all_teams = {}

def titlecase_team_name(name):
    if not name:
        return ''
    n = name.strip()
    n = re.sub(r'\s+', ' ', n)
    words = n.split(' ')
    lowercase_words = {'de', 'del', 'la', 'las', 'los', 'el', 'en', 'y', 'e'}
    acronyms = {
        'S.A.D.': 'S.A.D.', 'S.D.': 'S.D.', 'C.D.': 'C.D.', 'C.F.': 'C.F.',
        'U.D.': 'U.D.', 'A.D.': 'A.D.', 'F.C.': 'F.C.', 'C.P.': 'C.P.',
        'SAD': 'S.A.D.', 'SD': 'S.D.', 'CD': 'C.D.', 'CF': 'C.F.',
        'UD': 'U.D.', 'AD': 'A.D.', 'FC': 'F.C.', 'CP': 'C.P.',
        'AT.': 'At.', 'AT': 'At.'
    }
    formatted = []
    for i, w in enumerate(words):
        w_up = w.upper()
        w_clean_up = re.sub(r'[^A-Z]', '', w_up)
        if w_up in acronyms:
            formatted.append(acronyms[w_up])
        elif w_clean_up in acronyms:
            formatted.append(acronyms[w_clean_up])
        elif i > 0 and w.lower() in lowercase_words:
            formatted.append(w.lower())
        else:
            formatted.append(w.capitalize())
    return ' '.join(formatted)

for comp in target_competitions:
    print(f"🚀 Fetching groups for: {comp['name']} (ID: {comp['id']})...")
    comp_url = f"https://www.futbolaragon.com/pnfg/NPcd/NFG_Mov_LstGruposCompeticion?cod_primaria=&buscar=1&codcompeticion={comp['id']}&rt=1"
    comp_html = fetch_url(comp_url)
    
    # Extract groups
    group_matches = re.findall(r'href=[\"\']([^\"\' >]*CodGrupo=(\d+)[^\"\' >]*)[\"\'][^>]*>(.*?)</a>', comp_html, re.I)
    print(f"   Found {len(group_matches)} groups")

    for g_href, g_id, g_name in group_matches:
        g_clean_name = html.unescape(re.sub(r'<[^>]+>', '', g_name)).strip() or 'Grupo Único'
        # Fetch standings to get teams
        jornada_url = f"https://www.futbolaragon.com/pnfg/NPcd/NFG_CmpJornada?cod_primaria=1000120&CodCompeticion={comp['id']}&CodGrupo={g_id}&CodTemporada=22&CodJornada=1"
        jornada_html = fetch_url(jornada_url)

        # Extract teams
        team_matches = re.findall(r'href=[\"\']([^\"\' >]*Codigo_Equipo=(\d+)[^\"\' >]*)[\"\'][^>]*>(.*?)</a>', jornada_html, re.I)
        for t_href, t_id, t_raw_name in team_matches:
            t_clean_name = html.unescape(re.sub(r'<[^>]+>', '', t_raw_name)).strip()
            if t_clean_name and len(t_clean_name) > 2 and t_id not in all_teams:
                tc_name = titlecase_team_name(t_clean_name)
                all_teams[t_id] = {
                    'codigo': t_id,
                    'nombre': tc_name,
                    'equipo': tc_name,
                    'competicion': comp['name'],
                    'categoria': comp['cat'],
                    'sub': comp['sub'],
                    'grupo': g_clean_name,
                    'federacion': 'FARGF - Federación Aragonesa de Fútbol',
                    'comunidad': 'Aragón'
                }

print(f"\n✅ Total unique teams extracted across all 10 competitions: {len(all_teams)}")
with open('aragonesa_teams_scraped.json', 'w', encoding='utf-8') as f:
    json.dump(list(all_teams.values()), f, ensure_ascii=False, indent=2)

print("Saved aragonesa_teams_scraped.json successfully!")
