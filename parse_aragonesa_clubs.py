import subprocess
import re
import html
import time
import json

def fetch_url(url):
    cmd = [
        'curl', '-s', '-k', '-c', 'cookies.txt', '-b', 'cookies.txt', '-L', url
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, text=True, errors='ignore')
    return res.stdout

def clean_html(text):
    if not text:
        return ''
    t = re.sub(r'<[^>]+>', '', text)
    t = html.unescape(t)
    return re.sub(r'\s+', ' ', t).strip()

def color_to_hex(color_str):
    if not color_str:
        return '#2563eb'
    c = color_str.upper()
    if 'ROJ' in c or 'GRANA' in c or 'CORAL' in c:
        return '#dc2626'
    if 'AZUL' in c or 'CELESTE' in c or 'TURQUESA' in c:
        return '#2563eb'
    if 'VERD' in c:
        return '#16a34a'
    if 'AMARILL' in c or 'DORAD' in c:
        return '#eab308'
    if 'BLANC' in c:
        return '#ffffff'
    if 'NEGR' in c or 'OSCUR' in c:
        return '#0f172a'
    if 'VIOLET' in c or 'PURPUR' in c or 'MORAD' in c:
        return '#7c3aed'
    if 'NARANJ' in c:
        return '#ea580c'
    return '#2563eb'

print("🚀 Step 1: Scraping main club list from futbolaragon.com...")

all_scraped_clubs = []
page_lines = 250

for page in [1, 2, 3]:
    url = f"https://www.futbolaragon.com/pnfg/NPcd/NFG_Clubes?cod_primaria=1000118&Buscar=1&NPcd_PageLines={page_lines}&NPcd_Page={page}"
    page_html = fetch_url(url)
    rows = re.findall(r'<tr[^>]*>.*?</tr>', page_html, re.I | re.DOTALL)
    print(f"Page {page}: found {len(rows)} table rows")
    
    for r in rows:
        cols = re.findall(r'<td[^>]*>(.*?)</td>', r, re.I | re.DOTALL)
        if len(cols) >= 3:
            code_m = re.search(r'Ver\((\d+)\)', r, re.I)
            if not code_m:
                code_m = re.search(r'cod_club=(\d+)', r, re.I)
            
            code = code_m.group(1) if code_m else ''
            img_m = re.search(r'src=[\"\']([^\"\' >]*Clubes/[^\"\' >]*)[\"\']', r, re.I)
            img_url = img_m.group(1) if img_m else ''
            if img_url and not img_url.startswith('http'):
                img_url = 'https://files.futbolaragon.com' + img_url

            c_texts = [clean_html(c) for c in cols]
            # typical format: ['', '1001', 'REAL ZARAGOZA S.A.D. Zaragoza', 'Zaragoza', '15']
            raw_code = c_texts[1] if len(c_texts) > 1 else code
            raw_name = c_texts[2] if len(c_texts) > 2 else ''
            raw_loc = c_texts[3] if len(c_texts) > 3 else ''

            if not code and raw_code.isdigit():
                code = raw_code

            # Extract clean name from raw_name
            clean_name = raw_name
            if raw_loc and clean_name.endswith(raw_loc):
                clean_name = clean_name[:-len(raw_loc)].strip()
            clean_name = re.sub(r'^\d+\s*', '', clean_name).strip()

            if clean_name and code:
                all_scraped_clubs.append({
                    'codigo': code,
                    'nombre': clean_name,
                    'localidad': raw_loc or 'Zaragoza',
                    'img': img_url
                })

print(f"Total clubs scraped from index: {len(all_scraped_clubs)}")

# Deduplicate by code
unique_scraped = {}
for c in all_scraped_clubs:
    if c['codigo'] not in unique_scraped:
        unique_scraped[c['codigo']] = c

print(f"Unique clubs count: {len(unique_scraped)}")

# Save scraped list to JSON scratch file
with open('aragonesa_clubs_scraped.json', 'w', encoding='utf-8') as f:
    json.dump(list(unique_scraped.values()), f, ensure_ascii=False, indent=2)

print("Saved aragonesa_clubs_scraped.json successfully!")
