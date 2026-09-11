import re

file_path = '/Users/miguelsobejano/Desktop/Home/Proyectos/RS-Scouting-main/app.js'
with open(file_path, 'r') as f:
    content = f.read()

# Replace the arrays of positions
old_array = r"\['PO',\s*'DBD',\s*'DBZ',\s*'DCD',\s*'DCZ',\s*'DC',\s*'MCD',\s*'MCZ',\s*'MC',\s*'MVD',\s*'MVZ',\s*'MPD',\s*'MPZ',\s*'MP',\s*'MBD',\s*'MBZ',\s*'ACD',\s*'ACZ',\s*'AC'\]"
new_array = "['PT', 'LTD', 'LTI', 'CTD', 'CTI', 'CT', 'MC', 'INT', 'MP', 'ED', 'EI', 'DC']"
content = re.sub(old_array, new_array, content)

old_array_dash = r"\['-',\s*'PO',\s*'DBD',\s*'DBZ',\s*'DCD',\s*'DCZ',\s*'DC',\s*'MCD',\s*'MCZ',\s*'MC',\s*'MVD',\s*'MVZ',\s*'MPD',\s*'MPZ',\s*'MP',\s*'MBD',\s*'MBZ',\s*'ACD',\s*'ACZ',\s*'AC'\]"
new_array_dash = "['-', 'PT', 'LTD', 'LTI', 'CTD', 'CTI', 'CT', 'MC', 'INT', 'MP', 'ED', 'EI', 'DC']"
content = re.sub(old_array_dash, new_array_dash, content)

old_array_empty = r"\['',\s*'PO',\s*'DBD',\s*'DBZ',\s*'DCD',\s*'DCZ',\s*'DC',\s*'MCD',\s*'MCZ',\s*'MC',\s*'MVD',\s*'MVZ',\s*'MPD',\s*'MPZ',\s*'MP',\s*'MBD',\s*'MBZ',\s*'ACD',\s*'ACZ',\s*'AC'\]"
new_array_empty = "['', 'PT', 'LTD', 'LTI', 'CTD', 'CTI', 'CT', 'MC', 'INT', 'MP', 'ED', 'EI', 'DC']"
content = re.sub(old_array_empty, new_array_empty, content)

# Now for SYSTEM_STARTER_POSITIONS mappings
replacements = {
    "'PO'": "'PT'",
    "'DBD'": "'LTD'",
    "'DBZ'": "'LTI'",
    "'DCD'": "'CTD'",
    "'DCZ'": "'CTI'",
    "'MCD'": "'MC'",
    "'MCZ'": "'MC'",
    "'MVD'": "'INT'",
    "'MVZ'": "'INT'",
    "'MPD'": "'MP'",
    "'MPZ'": "'MP'",
    "'MBD'": "'ED'",
    "'MBZ'": "'EI'",
    "'AC'": "'DC'",
    "'ACD'": "'DC'",
    "'ACZ'": "'DC'",
}

# Be careful with 'DC'. Only 'DC' in the old array meant Defensa Central, which is now 'CT'.
# If there's 'DC' in the old array, it becomes 'CT'.
# The Delantero Centro was 'AC', which now becomes 'DC'.
# We need to map 'DC' -> 'CT' before we map 'AC' -> 'DC' to avoid conflict.

# Let's extract the SYSTEM_STARTER_POSITIONS block and process it
system_block_match = re.search(r"const SYSTEM_STARTER_POSITIONS = \{(.*?)\};", content, flags=re.DOTALL)
if system_block_match:
    block = system_block_match.group(1)
    
    # Do replacements safely inside the block
    for old, new in replacements.items():
        block = block.replace(old, new)
        
    # We still need to replace old 'DC' to 'CT'. 
    # But wait, what if 'AC' was already replaced to 'DC'? Then 'DC' becomes 'CT' too!
    # Let's do it in two passes safely.

with open(file_path, 'w') as f:
    f.write(content)
print("Updated arrays.")
