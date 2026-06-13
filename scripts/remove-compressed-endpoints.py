import json, os, sys, glob

obj_dir = os.path.normpath(sys.argv[1])
compressed_dir = os.path.join(obj_dir, 'compressed')

for gz in glob.glob(os.path.join(compressed_dir, '*{0}*.gz')):
    os.remove(gz)
    print(f'Removed: {gz}')

for manifest in ['staticwebassets.development.json', 'staticwebassets.build.endpoints.json']:
    path = os.path.join(obj_dir, manifest)
    if not os.path.exists(path):
        continue
    with open(path) as f:
        data = json.load(f)
    if 'Endpoints' in data:
        data['Endpoints'] = [
            e for e in data['Endpoints']
            if not any(s.get('Name') == 'Content-Encoding' and s.get('Value') == 'gzip'
                       for s in e.get('Selectors', []))
        ]
    if 'Root' in data:
        def clean_children(node):
            if not isinstance(node, dict):
                return
            for k in list(node.keys()):
                if k.endswith('.js.gz') or k.endswith('.wasm.gz') or k.endswith('.dll.gz') or k.endswith('.pdb.gz'):
                    del node[k]
                elif isinstance(node[k], dict):
                    clean_children(node[k])
        clean_children(data['Root'])
    with open(path, 'w') as f:
        json.dump(data, f, separators=(',', ':'))
    print(f'Cleaned compressed endpoints from {manifest}')
