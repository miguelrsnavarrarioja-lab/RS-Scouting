import re

with open('app.js', 'r') as f:
    content = f.read()

# Pattern to match:
# if (isEdit) {
#   const idx = state.directory.<COLLECTION>.findIndex(VAR => VAR && (String(VAR.id) === String(<IDVAR>) || (VAR.codigo && String(VAR.codigo) === String(<IDVAR>))));
#   if (idx !== -1) state.directory.<COLLECTION>[idx] = <UPDATED_VAR>;
# } else {
#   state.directory.<COLLECTION>.unshift(<UPDATED_VAR>);
# }

pattern = re.compile(
    r'if\s*\(isEdit\)\s*\{\s*const\s+([a-zA-Z0-9_]+)\s*=\s*state\.directory\.([a-zA-Z0-9_]+)\.findIndex\(([a-zA-Z0-9_]+)\s*=>\s*\3\s*&&\s*\(String\(\3\.id\)\s*===\s*String\(([a-zA-Z0-9_]+)\)\s*\|\|\s*\(\3\.codigo\s*&&\s*String\(\3\.codigo\)\s*===\s*String\(\4\)\)\)\);\s*if\s*\(\1\s*!==\s*-1\)\s*state\.directory\.\2\[\1\]\s*=\s*([a-zA-Z0-9_]+);\s*\}\s*else\s*\{\s*state\.directory\.\2\.unshift\(\5\);\s*\}'
)

def replace_match(m):
    idx_var = m.group(1)
    collection = m.group(2)
    loop_var = m.group(3)
    id_var = m.group(4)
    updated_var = m.group(5)
    
    return f"""const {idx_var} = state.directory.{collection}.findIndex({loop_var} => {loop_var} && (String({loop_var}.id) === String({id_var}) || ({loop_var}.codigo && String({loop_var}.codigo) === String({id_var}))));
      if ({idx_var} !== -1) {{
        state.directory.{collection}[{idx_var}] = {updated_var};
      }} else {{
        state.directory.{collection}.unshift({updated_var});
      }}"""

new_content, count = pattern.subn(replace_match, content)

print(f"Replaced {count} occurrences.")

with open('app.js', 'w') as f:
    f.write(new_content)

