from pathlib import Path
import json, html, zipfile
from PIL import Image, ImageDraw, ImageFont
r=Path(__file__).parent
refs=json.loads((r/'references.json').read_text())
font=ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc',24)
small=ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc',19)
board=Image.new('RGB',(1800,1740),'#eef0f2'); draw=ImageDraw.Draw(board)
md=['# Qubit Studio — evidence-based reference pack','', 'These are source references, not an approved app design. Six entries have assigned roles. Official screenshots, marketing illustrations and exercised interactions are explicitly distinguished. Screenshots are for design reference, not licensed assets to ship in the product.','', '## Start here','Open index.html for the annotated visual board. Attach reference-board.jpg, REFERENCES.md and CLAUDE-CHATGPT-PROMPT.md to your design model, plus full-size screenshots as needed.','', '## Synthesis','SOLIDWORKS structure + Mechanical Watch interaction + Onshape explode guides + Falstad linked results + Shapr3D object/material treatment. The synchronized 3D/schematic split and material-to-model mapping are our proposed synthesis, not verified features of every reference.','']
cards=[]
for i,ref in enumerate(refs):
 x=(i%2)*900;y=(i//2)*580
 draw.text((x+22,y+18),ref['id']+'  '+ref['name'],font=font,fill='#17212a')
 filename=ref['images'][0]
 if ref['id']=='C':filename='06-watch-exploded.png'
 im=Image.open(r/'screenshots'/filename).convert('RGB')
 if ref['id']=='B':im=im.crop((290,41,1090,475))
 im.thumbnail((855,440));board.paste(im,(x+(900-im.width)//2,y+65+(440-im.height)//2))
 draw.text((x+22,y+523),ref['component'][:76],font=small,fill='#315c89')
 md.extend([f"## {ref['id']}. {ref['name']}",f"Source: {ref['url']}",f"Evidence: {ref['evidence']}",f"Observed: {ref['observed']}",f"Borrow: {ref['borrow']}",f"Avoid: {ref['avoid']}",f"Components: {ref['component']}",'Images: '+', '.join('screenshots/'+n for n in ref['images']),''])
 imgs=''.join(f'<a href="screenshots/{n}"><img loading="lazy" src="screenshots/{n}"></a>' for n in ref['images'])
 notes=''.join(f'<p><b>{k.title()}:</b> {html.escape(ref[k])}</p>' for k in ['evidence','observed','borrow','avoid','component'])
 cards.append(f'<section><h2>{ref["id"]}. {html.escape(ref["name"])}</h2><a href="{ref["url"]}">Open original source ↗</a><div class="images">{imgs}</div>{notes}</section>')
md.extend(['## Gaps and exclusions','- SOLIDWORKS marketing page failed; official help images supplied the actual interface evidence. Direct image download was blocked; the images were extracted from the rendered help page.','- Shapr3D workspace help hit a Cloudflare verification wall. The supplied Shapr3D images are marketing/rendering evidence, not an authenticated editor session.','- Spline homepage and EveryCircuit landing page were inspected but excluded from the curated board: those captures did not add enough specific workspace evidence.','- Watch explode-slider drag was exercised and visually verified. SOLIDWORKS/Onshape editor workflows and Shapr3D material dragging were not run. Falstad default rendered; numeric response was not tested in this pack.','- No captured reference establishes a quantum-chip geometry model, material physics, or our proposed synchronized 3D/schematic implementation.','- No production application code was changed.',''])
(r/'REFERENCES.md').write_text('\n'.join(md))
board.save(r/'reference-board.jpg',quality=94)
(r/'index.html').write_text('''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Qubit Studio reference pack</title><style>body{margin:0;background:#eef0f2;color:#202a33;font:16px/1.6 system-ui}main{max-width:1200px;margin:auto;padding:40px 24px}h1{font-size:38px;line-height:1.1}h2{font-size:25px}a{color:#245ea0}.intro{max-width:850px}section{background:white;padding:28px;margin:28px 0;border:1px solid #d1d7dd}.images{display:flex;gap:16px;margin:22px 0;align-items:center;flex-wrap:wrap}.images a{flex:1;min-width:260px;text-align:center;background:#f5f5f5}.images img{max-width:100%;max-height:560px;object-fit:contain}.board{width:100%}b{color:#152f46}code{background:#dde4eb;padding:3px 7px}</style></head><body><main><h1>Qubit Studio<br>Reference anatomy</h1><p class="intro">A CAD workspace that makes a complex object understandable through manipulation. Each reference has a specific role, observed evidence and explicit limits. This is not a final UI mockup.</p><p><a href="CLAUDE-CHATGPT-PROMPT.md">Model handoff prompt</a> · <a href="REFERENCES.md">Evidence and source notes</a></p><img class="board" src="reference-board.jpg">'''+''.join(cards)+'''<section><h2>Use the pack</h2><p>Upload the board, handoff prompt and source notes. Add full-size screenshots for detail. Local filesystem paths alone do not let a cloud chat model read your files. Keep references as inspiration, not production assets.</p><p>Primary recipe: SOLIDWORKS structure; Mechanical Watch manipulation; Onshape assembly guides; Falstad linked results; Shapr3D rendering restraint.</p></section></main></body></html>''')
selected=['index.html','reference-board.jpg','REFERENCES.md','references.json','CLAUDE-CHATGPT-PROMPT.md']
selected+=['screenshots/'+n for ref in refs for n in ref['images']]
with zipfile.ZipFile(r/'qubit-studio-reference-pack.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in dict.fromkeys(selected):
  p=r/name
  assert p.exists() and p.stat().st_size>0,name
  z.write(p,name)
with zipfile.ZipFile(r/'qubit-studio-reference-pack.zip') as z:
 assert z.testzip() is None
 print('Verified archive:',len(z.namelist()),'files')
print('Built annotated HTML, source notes, board and upload ZIP.')
