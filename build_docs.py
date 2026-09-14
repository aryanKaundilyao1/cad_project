import re

doc_a_path = 'docs/intelligence-engine/opportunity_intelligence_platform.md'
doc_b_path = 'docs/purchase_likelihood_prediction_engine.md'

with open(doc_a_path, 'r') as f:
    doc_a = f.read()

with open(doc_b_path, 'r') as f:
    doc_b = f.read()

def split_by_headers(text):
    # Split using re.finditer on lines that start with numbers followed by dot e.g. "0. System Architecture Overview", "1. Buying Intent Signals", "1.1 Digital Research"
    # Wait, the markdown doesn't have standard `#` for all headers.
    lines = text.split('\n')
    sections = []
    current_title = "START"
    current_content = []
    
    for line in lines:
        if re.match(r'^(\d+\.\s.*|##?\s.*)', line):
            if current_content:
                sections.append((current_title, '\n'.join(current_content)))
            current_title = line.strip()
            current_content = [line]
        else:
            current_content.append(line)
    if current_content:
        sections.append((current_title, '\n'.join(current_content)))
    return sections

a_sections = split_by_headers(doc_a)
b_sections = split_by_headers(doc_b)

print("DOC A SECTIONS:")
for t, _ in a_sections:
    print(t)

print("\nDOC B SECTIONS:")
for t, _ in b_sections:
    print(t)
