const source = document.getElementById('source');
const gutter = document.getElementById('gutter');
const chars = document.getElementById('chars');
function updateEditor(){
  const n = Math.max(1, source.value.split('\n').length);
  gutter.textContent = Array.from({length:n}, (_,i)=>i+1).join('\n');
  chars.textContent = `${source.value.length} CHARACTERS`;
}
source.addEventListener('input', updateEditor);
source.addEventListener('scroll', ()=>{gutter.scrollTop=source.scrollTop});
document.getElementById('example').onclick = () => {
  source.value = `int main() {\n    int count = 10;\n    float price = 25.5;\n    if (count >= 5) {\n        count = count + 1;\n    }\n    return count;\n}`;
  updateEditor();
};
document.getElementById('clear').onclick = () => {source.value='';updateEditor();};
document.getElementById('file').onchange = async e => {
  const file=e.target.files[0]; if(file){source.value=await file.text();updateEditor();}
  e.target.value='';
};
document.getElementById('analyze').onclick = async () => {
  const btn=document.getElementById('analyze'); btn.disabled=true; btn.textContent='Analyzing…';
  try{
    const res=await fetch('/analyze',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({source:source.value,spec:document.getElementById('spec').value})});
    const data=await res.json(); if(!res.ok) throw new Error(data.error||'Analysis failed');
    document.getElementById('total').textContent=data.total;
    document.getElementById('unique').textContent=data.unique;
    document.getElementById('errorCount').textContent=data.errors.length;
    document.getElementById('state').textContent=data.message.toUpperCase();
    const tbody=document.getElementById('tokenRows'); tbody.innerHTML='';
    if(!data.tokens.length) tbody.innerHTML='<tr><td colspan="5" class="empty">No tokens found.</td></tr>';
    data.tokens.forEach((t,i)=>{
      const tr=document.createElement('tr');
      [i+1,t.lexeme,t.type,t.line,t.column].forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.appendChild(td);});
      tbody.appendChild(tr);
    });
    const summary=document.getElementById('summary'); summary.innerHTML='';
    const entries=Object.entries(data.summary);
    if(!entries.length) summary.textContent='No tokens to summarize.';
    entries.forEach(([name,count])=>{const row=document.createElement('div');row.className='summary-item';row.textContent=`${name} — ${count}`;summary.appendChild(row);});
    const diag=document.getElementById('diagnostics'); diag.innerHTML='';
    if(!data.errors.length) diag.textContent='No lexical errors detected.';
    data.errors.forEach(err=>{const p=document.createElement('div');p.className='error';p.textContent=err;diag.appendChild(p);});
    document.getElementById('results').scrollIntoView({behavior:'smooth'});
  }catch(err){alert(err.message);}
  finally{btn.disabled=false;btn.innerHTML='Analyze code <b>↗</b>';}
};
updateEditor();
