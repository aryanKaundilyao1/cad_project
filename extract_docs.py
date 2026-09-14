import re

with open('/tmp/prompt_contents.txt', 'r') as f:
    lines = f.readlines()

doc_a = []
doc_b = []
current_doc = None

for line in lines:
    if line.startswith('The following changes were made by the USER to: '):
        if 'opportunity_intelligence_platform.md' in line:
            current_doc = 'A'
        elif 'purchase_likelihood_prediction_engine.md' in line:
            current_doc = 'B'
        continue
    
    if line.startswith('[diff_block_end]'):
        current_doc = None
    
    if current_doc and line.startswith('+'):
        # Extract content after the '+'
        content = line[1:]
        if current_doc == 'A':
            doc_a.append(content)
        elif current_doc == 'B':
            doc_b.append(content)

with open('docs/intelligence-engine/opportunity_intelligence_platform.md', 'w') as f:
    f.writelines(doc_a)

with open('docs/purchase_likelihood_prediction_engine.md', 'w') as f:
    f.writelines(doc_b)

print(f"Extracted Doc A: {len(doc_a)} lines")
print(f"Extracted Doc B: {len(doc_b)} lines")
