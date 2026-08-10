import re
import json

def clean_and_titlecase_club_name(raw_name):
    if not raw_name:
        return ''
    
    n = raw_name.strip()
    
    # Check pattern like 'CASPE-C.D. Caspe' or 'ZUERA-C.D. Zuera' or 'PINA-C.D. Pina De Ebro'
    # If the text after '-' starts with acronym and then repeats town/locality name
    match = re.match(r'^([A-Z0-9\sÁÉÍÓÚÑ\.\-]+?)\s*\-\s*([A-Z\.\s]+)\s+(.*)$', n, re.I)
    if match:
        left_part = match.group(1).strip()
        acronym = match.group(2).strip()
        right_part = match.group(3).strip()
        
        # If right_part is similar to left_part or locality
        left_clean = left_part.upper().replace(' ', '')
        right_clean = right_part.upper().replace(' ', '')
        if left_clean in right_clean or right_clean in left_clean or len(right_part) > 0:
            n = f"{left_part} {acronym}"
    elif '-' in n:
        parts = n.split('-')
        if len(parts) == 2:
            left, right = parts[0].strip(), parts[1].strip()
            n = f"{left} {right}"

    # Replace multiple spaces
    n = re.sub(r'\s+', ' ', n).strip()

    # Titlecase words
    words = n.split(' ')
    lowercase_words = {'de', 'del', 'la', 'las', 'los', 'el', 'en', 'y', 'e'}
    acronyms = {
        'S.A.D.': 'S.A.D.', 'S.D.': 'S.D.', 'C.D.': 'C.D.', 'C.F.': 'C.F.',
        'U.D.': 'U.D.', 'A.D.': 'A.D.', 'F.C.': 'F.C.', 'C.P.': 'C.P.',
        'SAD': 'S.A.D.', 'SD': 'S.D.', 'CD': 'C.D.', 'CF': 'C.F.',
        'UD': 'U.D.', 'AD': 'A.D.', 'FC': 'F.C.', 'CP': 'C.P.',
        'AT.': 'At.', 'AT': 'At.'
    }

    formatted_words = []
    for i, w in enumerate(words):
        w_upper = w.upper()
        w_clean_upper = re.sub(r'[^A-Z]', '', w_upper)

        if w_upper in acronyms:
            formatted_words.append(acronyms[w_upper])
        elif w_clean_upper in acronyms:
            formatted_words.append(acronyms[w_clean_upper])
        elif i > 0 and w.lower() in lowercase_words:
            formatted_words.append(w.lower())
        else:
            formatted_words.append(w.capitalize())

    res = ' '.join(formatted_words)
    # Fix common Spanish accents if missing
    res = res.replace('Aragn', 'Aragón').replace('Gllego', 'Gállego').replace('Alfajarn', 'Alfajarín').replace('Boquieni', 'Boquiñeni')
    return res

with open('aragonesa_clubs_scraped.json', 'r', encoding='utf-8') as f:
    scraped_clubs = json.load(f)

print("Formatted club names sample:")
for c in scraped_clubs[:25]:
    raw = c['nombre']
    tc = clean_and_titlecase_club_name(raw)
    print(f"RAW: {raw:<35} ===> {tc}")
