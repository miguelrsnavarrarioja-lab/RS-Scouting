import re

file_path = '/Users/miguelsobejano/Desktop/Home/Proyectos/RS-Scouting-main/app.js'
with open(file_path, 'r') as f:
    content = f.read()

# Replace the arrays of positions globally again just in case
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
# Let's extract the SYSTEM_STARTER_POSITIONS block and process it
system_block_match = re.search(r"(const SYSTEM_STARTER_POSITIONS = \{.*?\}\;)", content, flags=re.DOTALL)
if system_block_match:
    original_block = system_block_match.group(1)
    
    # We must do replacements carefully:
    # 1. Map old 'DC' to 'CT' FIRST.
    # 2. Map old 'AC' to 'DC' LATER so it doesn't get overwritten.
    
    # Actually, we can use a regex sub with a mapping dict.
    def replacer(match):
        val = match.group(1)
        # Old -> New mappings
        mapping = {
            'PO': 'PT',
            'DBD': 'LTD',
            'DBZ': 'LTI',
            'DCD': 'CTD',
            'DCZ': 'CTI',
            'DC': 'CT', # Old DC -> CT
            'MCD': 'MC',
            'MCZ': 'MC',
            'MVD': 'INT',
            'MVZ': 'INT',
            'MPD': 'MP',
            'MPZ': 'MP',
            'MBD': 'ED',
            'MBZ': 'EI',
            'AC': 'DC', # Old AC -> DC
            'ACD': 'DC',
            'ACZ': 'DC'
        }
        return f"'{mapping.get(val, val)}'"
    
    new_block = re.sub(r"'([A-Z]+)'", replacer, original_block)
    content = content.replace(original_block, new_block)
    print("Replaced SYSTEM_STARTER_POSITIONS successfully.")
else:
    print("Could not find SYSTEM_STARTER_POSITIONS")

# There is also one line with:
# const defaultStarterPositions = SYSTEM_STARTER_POSITIONS[formation] || ['PO', 'DBD', 'DCD', 'DCZ', 'DBZ', 'MCD', 'MBD', 'MBZ', 'ACD', 'ACZ', 'AC'];
# We can just replace any array containing 'PO', 'DBD', 'DCD' with a new default fallback.
def fallback_replacer(match):
    arr_str = match.group(1)
    return arr_str.replace("'PO'", "'PT'").replace("'DBD'", "'LTD'").replace("'DCD'", "'CTD'").replace("'DCZ'", "'CTI'").replace("'DBZ'", "'LTI'").replace("'MCD'", "'MC'").replace("'MBD'", "'ED'").replace("'MBZ'", "'EI'").replace("'ACD'", "'DC'").replace("'ACZ'", "'DC'").replace("'AC'", "'DC'").replace("'MC'", "'MC'")

content = re.sub(r"(\|\|\s*\[(.*?)\])", fallback_replacer, content)


with open(file_path, 'w') as f:
    f.write(content)
print("Updated positions in app.js")
