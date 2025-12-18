
path = 'c:\\Users\\lucme\\jeuprotec\\jeu-mobile\\game_engine.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

new_content = content.replace("'shuffle': False", "'shuffle': True")

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Updated shuffle: True")
