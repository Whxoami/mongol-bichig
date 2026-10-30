// Rule-based converters, used only when a word is not in the dictionary.
const FEM_C = /[эөүе]/, V_C = 'аэоуөүиыеёюя';
const isV = ch => V_C.includes(ch);
export function cyrToTrad(w){
  w = w.toLowerCase();
  let out = '', seenV = false, i = 0;
  const n = w.length;
  const fem = FEM_C.test(w);
  while(i<n){
    const ch = w[i], nx = w[i+1];
    if(ch===nx && 'аэоуөү'.includes(ch)){
      if(!seenV){
        if(ch==='а') out+='ᠠ'; else if(ch==='э') out+='ᠡ';
        else if(ch==='о') out+='ᠣ'+'ᠣ'; else if(ch==='у') out+='ᠠᠭᠤ';
        else if(ch==='ө') out+='ᠥᠥ'; else out+='ᠡᠭᠦ';
        if(ch==='а'||ch==='э') out+= (ch==='а'?'ᠠ':'ᠡ');
      } else {
        if(ch==='а') out+='ᠠᠭᠠ'; else if(ch==='э') out+='ᠡᠭᠡ';
        else if(ch==='о') out+='ᠤᠭᠤ'; else if(ch==='у') out+='ᠤᠭᠤ';
        else if(ch==='ө') out+='ᠦᠭᠦ'; else out+='ᠦᠦ';
      }
      seenV = true; i+=2; continue;
    }
    switch(ch){
      case 'а': out+='ᠠ'; seenV=true; break;
      case 'э': out+='ᠡ'; seenV=true; break;
      case 'и': out+='ᠢ'; seenV=true; break;
      case 'ы': out+='ᠢ'; seenV=true; break;
      case 'о': out+= seenV?'ᠤ':'ᠣ'; seenV=true; break;
      case 'у': out+='ᠤ'; seenV=true; break;
      case 'ө': out+= seenV?'ᠦ':'ᠥ'; seenV=true; break;
      case 'ү': out+='ᠦ'; seenV=true; break;
      case 'й': out+='ᠢ'; if(nx && isV(nx)) out=out.slice(0,-1)+'ᠶ'; break;
      case 'я': out+='ᠶᠠ'; seenV=true; break;
      case 'ю': out+= fem?'ᠶᠦ':'ᠶᠤ'; seenV=true; break;
      case 'е': out+= 'ᠶᠡ'; seenV=true; break;
      case 'ё': out+= 'ᠶᠣ'; seenV=true; break;
      case 'б': out+='ᠪ'; break;
      case 'в': out+='ᠪ'; break;
      case 'г': out+='ᠭ'; break;
      case 'д': out+='ᠳ'; break;
      case 'ж': out+='ᠵ'; break;
      case 'з': out+='ᠵ'; break;
      case 'к': out+='ᠻ'; break;
      case 'л': out+='ᠯ'; break;
      case 'м': out+='ᠮ'; break;
      case 'н': out+= (nx && !isV(nx) && nx!=='ь' && 'гхкб'.includes(nx))?'ᠩ':'ᠨ'; break;
      case 'п': out+='ᠫ'; break;
      case 'р': out+='ᠷ'; break;
      case 'с': out+='ᠰ'; break;
      case 'т': out+='ᠲ'; break;
      case 'ф': out+='ᠹ'; break;
      case 'х': out+='ᠬ'; break;
      case 'ц': out+='ᠴ'; break;
      case 'ч': out+='ᠴ'; break;
      case 'ш': out+='ᠱ'; break;
      case 'ь': case 'ъ': break;
      default: out+=ch;
    }
    i++;
  }
  return out;
}
export function tradToCyr(w){
  const chars=[...w];
  const fem = /[ᠡᠥᠦ]/.test(w);
  const firstV = chars.find(c=>'ᠠᠡᠢᠣᠤᠥᠦ'.includes(c));
  let out='', seenV=false;
  for(let i=0;i<chars.length;i++){
    const ch=chars[i], nx=chars[i+1];
    switch(ch){
      case 'ᠠ': out+= fem?'э':'а'; seenV=true; break;
      case 'ᠡ': out+='э'; seenV=true; break;
      case 'ᠢ': out+='и'; seenV=true; break;
      case 'ᠣ': out+='о'; seenV=true; break;
      case 'ᠤ': out+= seenV? (firstV==='ᠣ'?'о':'у') : 'у'; seenV=true; break;
      case 'ᠥ': out+='ө'; seenV=true; break;
      case 'ᠦ': out+= seenV? (firstV==='ᠥ'?'ө':'ү') : 'ү'; seenV=true; break;
      case 'ᠪ': out+= (nx&&'ᠠᠡᠢᠣᠤᠥᠦ'.includes(nx)&&chars[i-1]&&'ᠠᠡᠢᠣᠤᠥᠦ'.includes(chars[i-1]))?'в':'б'; break;
      case 'ᠫ': out+='п'; break;
      case 'ᠭ': out+='г'; break; case 'ᠬ': out+='х'; break;
      case 'ᠳ': out+='д'; break; case 'ᠲ': out+='т'; break;
      case 'ᠵ': out+='з'; break; case 'ᠴ': out+='ч'; break;
      case 'ᠶ': out+='й'; break; case 'ᠷ': out+='р'; break;
      case 'ᠯ': out+='л'; break; case 'ᠮ': out+='м'; break;
      case 'ᠨ': case 'ᠩ': out+='н'; break;
      case 'ᠰ': out+='с'; break; case 'ᠱ': out+='ш'; break;
      case 'ᠸ': out+='в'; break; case 'ᠹ': out+='ф'; break;
      case 'ᠻ': out+='к'; break; case 'ᠼ': out+='ц'; break;
      default: out+=ch;
    }
  }
  return out;
}
