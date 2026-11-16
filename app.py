from flask import Flask, render_template, request, jsonify
from pathlib import Path
import subprocess, tempfile, re, os

app = Flask(__name__)
ROOT = Path(__file__).resolve().parent
ENGINE = ROOT / "mini_lex"
SPECS = {"C-like": ROOT / "specs" / "clike.lex",
         "Arithmetic": ROOT / "specs" / "arithmetic.lex"}

@app.get("/")
def home():
    return render_template("index.html")

@app.post("/analyze")
def analyze():
    data = request.get_json(silent=True) or {}
    source = data.get("source", "")
    spec_name = data.get("spec", "C-like")
    if not isinstance(source, str) or len(source) > 100000:
        return jsonify({"error": "Please provide source code under 100,000 characters."}), 400
    spec = SPECS.get(spec_name)
    if not spec:
        return jsonify({"error": "Unknown lexer specification."}), 400
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", encoding="utf-8", delete=False) as f:
        f.write(source)
        source_path = f.name
    try:
        result = subprocess.run([str(ENGINE), str(spec), source_path],
                                capture_output=True, text=True, timeout=5)
        output = result.stdout
        rows = []
        in_table = False
        for line in output.splitlines():
            if line.strip().startswith("LEXEME") and "TOKEN" in line:
                in_table = True
                continue
            if in_table and set(line.strip()) == {"-"}:
                continue
            if in_table:
                if not line.strip():
                    in_table = False
                    continue
                m = re.match(r"^(.*?)\s{2,}(\S+)\s+(\d+):(\d+)$", line)
                if m:
                    rows.append({"lexeme": m.group(1).rstrip(), "type": m.group(2),
                                 "line": int(m.group(3)), "column": int(m.group(4))})
        errors = [x for x in result.stderr.splitlines() if "Lexical error" in x]
        summary = {}
        for row in rows:
            summary[row["type"]] = summary.get(row["type"], 0) + 1
        return jsonify({"tokens": rows, "summary": summary, "errors": errors,
                        "total": len(rows), "unique": len(summary),
                        "message": "Analysis completed." if not errors else f"{len(errors)} lexical error(s) found."})
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Analysis timed out."}), 408
    finally:
        try: os.unlink(source_path)
        except OSError: pass

@app.get("/health")
def health():
    return "ok", 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
