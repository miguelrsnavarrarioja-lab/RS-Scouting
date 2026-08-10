import subprocess
import re
import html

cmd = ['curl', '-s', '-k', '-c', 'cookies.txt', '-b', 'cookies.txt', '-L', 'https://www.futbolaragon.com/pnfg/NPcd/NFG_Mov_LstCompeticiones?cod_primaria=&competicion=1&rt=1']
res = subprocess.run(cmd, stdout=subprocess.PIPE, text=True, errors='ignore').stdout

# Look for links or text containing CADETE, INFANTIL, ALEVIN, BENJAMIN
matches = re.findall(r'<a[^>]*href=[\"\']([^\"\' >]*)[\"\'][^>]*>(.*?)</a>', res, re.I | re.DOTALL)
print(f"Total links: {len(matches)}")

target_categories = [
    'CADETE', 'INFANTIL', 'ALEVÍN', 'ALEVIN', 'BENJAMÍN', 'BENJAMIN'
]

found_comps = []
for href, text in matches:
    clean_t = re.sub(r'<[^>]+>', '', text).strip()
    clean_t_upper = clean_t.upper()
    if any(cat in clean_t_upper for cat in target_categories):
        found_comps.append((clean_t, href))

print(f"Found {len(found_comps)} target competition links:")
for name, href in found_comps[:30]:
    print(f"{name}  ===>  {href}")
