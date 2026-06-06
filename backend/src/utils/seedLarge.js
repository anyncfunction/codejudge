const { getDb, exec, saveDb } = require('../config/db');
const { initDb } = require('./initDb');

// ============================================================
// 题库生成器 - 生成 10000 道题目
// ============================================================

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function seed() {
  await initDb();
  const db = await getDb();
  console.log('清除旧数据...');

  // 删除旧数据并重置自增计数器
  db.run('DELETE FROM submissions');
  db.run('DELETE FROM problems');
  db.run("DELETE FROM sqlite_sequence WHERE name = 'problems'");

  let count = 0;
  const total = 10000;
  const progTarget = 3500;
  const choiceTarget = 3500;
  const fillTarget = 3000;

  const startTime = Date.now();
  const BATCH_SAVE = 200; // Save to disk every 200 inserts

  // Helper: execute insert and track
  function insertOne(title, desc, type, diff, tags, sol, tc, opt, ba) {
    db.run(
      'INSERT INTO problems (title, description, type, difficulty, tags, solution, test_cases, options, blanks_answer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, desc, type, diff, tags, sol, tc, opt, ba]
    );
    count++;
    if (count % BATCH_SAVE === 0) saveDb();
  }

  // ===== 编程题 (3500) =====
  console.log('生成编程题...');
  const progProblems = [
    { title:'计算数字之和', dd:'easy', tags:'数组,遍历', gen(){ const n=rand(2,20); const a=Array.from({length:n},()=>rand(-100,100)); const s=a.reduce((x,y)=>x+y,0); return {tc:[`${n}\n${a.join(' ')}`,String(s)]}; } },
    { title:'找最大值', dd:'easy', tags:'数组,比较', gen(){ const n=rand(2,20); const a=Array.from({length:n},()=>rand(-200,200)); return {tc:[`${n}\n${a.join(' ')}`,String(Math.max(...a))]}; } },
    { title:'找最小值', dd:'easy', tags:'数组,比较', gen(){ const n=rand(2,20); const a=Array.from({length:n},()=>rand(-200,200)); return {tc:[`${n}\n${a.join(' ')}`,String(Math.min(...a))]}; } },
    { title:'计算平均值', dd:'easy', tags:'数组,统计', gen(){ const n=rand(2,20); const a=Array.from({length:n},()=>rand(0,100)); return {tc:[`${n}\n${a.join(' ')}`,String(Math.floor(a.reduce((x,y)=>x+y,0)/n))]}; } },
    { title:'统计正数个数', dd:'easy', tags:'数组,计数', gen(){ const n=rand(3,20); const a=Array.from({length:n},()=>rand(-50,50)); return {tc:[`${n}\n${a.join(' ')}`,String(a.filter(x=>x>0).length)]}; } },
    { title:'统计负数个数', dd:'easy', tags:'数组,计数', gen(){ const n=rand(3,20); const a=Array.from({length:n},()=>rand(-50,50)); return {tc:[`${n}\n${a.join(' ')}`,String(a.filter(x=>x<0).length)]}; } },
    { title:'数组元素翻倍', dd:'easy', tags:'数组,映射', gen(){ const n=rand(2,12); const a=Array.from({length:n},()=>rand(1,50)); return {tc:[`${n}\n${a.join(' ')}`,a.map(x=>x*2).join(' ')]}; } },
    { title:'数组元素平方', dd:'easy', tags:'数组,映射', gen(){ const n=rand(2,12); const a=Array.from({length:n},()=>rand(-10,10)); return {tc:[`${n}\n${a.join(' ')}`,a.map(x=>x*x).join(' ')]}; } },
    { title:'计算字符串长度', dd:'easy', tags:'字符串,基础', gen(){ const s=pick(['hello','world','algorithm','computer','program','javascript','python','codejudge','online']); return {tc:[s,String(s.length)]}; } },
    { title:'字符串转大写', dd:'easy', tags:'字符串,转换', gen(){ const s=pick(['Hello','World','Apple','Banana','Code','Judge']); return {tc:[s,s.toUpperCase()]}; } },
    { title:'字符串转小写', dd:'easy', tags:'字符串,转换', gen(){ const s=pick(['HELLO','WORLD','PYTHON','JAVA','CODE']); return {tc:[s,s.toLowerCase()]}; } },
    { title:'反转字符串', dd:'easy', tags:'字符串,反转', gen(){ const s=pick(['hello','world','python','algorithm']); return {tc:[s,s.split('').reverse().join('')]}; } },
    { title:'统计元音字母个数', dd:'easy', tags:'字符串,统计', gen(){ const s=pick(['hello','beautiful','algorithm','education']); return {tc:[s,String((s.match(/[aeiou]/gi)||[]).length)]}; } },
    { title:'A加B', dd:'easy', tags:'数学,基础', gen(){ const a=rand(-100,100);const b=rand(-100,100); return {tc:[`${a} ${b}`,String(a+b)]}; } },
    { title:'A减B', dd:'easy', tags:'数学,基础', gen(){ const a=rand(10,200);const b=rand(1,a); return {tc:[`${a} ${b}`,String(a-b)]}; } },
    { title:'A乘B', dd:'easy', tags:'数学,基础', gen(){ const a=rand(1,30);const b=rand(1,30); return {tc:[`${a} ${b}`,String(a*b)]}; } },
    { title:'A除以B', dd:'easy', tags:'数学,基础', gen(){ const b=rand(1,20);const q=rand(1,20); return {tc:[`${b*q} ${b}`,String(q)]}; } },
    { title:'取余数', dd:'easy', tags:'数学,基础', gen(){ const b=rand(2,20);const a=rand(b,200); return {tc:[`${a} ${b}`,String(a%b)]}; } },
    { title:'判断奇偶', dd:'easy', tags:'条件判断', gen(){ const n=rand(1,1000); return {tc:[String(n),n%2===0?'EVEN':'ODD']}; } },
    { title:'判断正负零', dd:'easy', tags:'条件判断', gen(){ const n=pick([rand(1,100),rand(-100,-1),0]); return {tc:[String(n),n>0?'POSITIVE':n<0?'NEGATIVE':'ZERO']}; } },
    { title:'两数比较', dd:'easy', tags:'条件判断', gen(){ const a=rand(1,100);const b=pick([a,rand(1,100)]); return {tc:[`${a} ${b}`,a>b?'GREATER':a===b?'EQUAL':'LESS']}; } },
    { title:'打印1到N', dd:'easy', tags:'循环,输出', gen(){ const n=rand(3,10); return {tc:[String(n),Array.from({length:n},(_,i)=>i+1).join('\n')]}; } },
    { title:'升序排列', dd:'easy', tags:'排序,数组', gen(){ const n=rand(3,12);const a=Array.from({length:n},()=>rand(-50,50)); return {tc:[`${n}\n${a.join(' ')}`,[...a].sort((x,y)=>x-y).join(' ')]}; } },
    { title:'降序排列', dd:'easy', tags:'排序,数组', gen(){ const n=rand(3,12);const a=Array.from({length:n},()=>rand(-50,50)); return {tc:[`${n}\n${a.join(' ')}`,[...a].sort((x,y)=>y-x).join(' ')]}; } },
    { title:'阶乘计算', dd:'medium', tags:'数学,循环', gen(){ const n=rand(3,10);let f=1;for(let i=2;i<=n;i++)f*=i; return {tc:[String(n),String(f)]}; } },
    { title:'判断质数', dd:'medium', tags:'数学,数论', gen(){ const pr=[2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97]; const co=[4,6,8,9,10,12,14,15,16,18,20,21,22,24,25,26,27,28,30]; const ip=!!rand(0,1); const n=ip?pick(pr):pick(co); return {tc:[String(n),ip?'YES':'NO']}; } },
    { title:'三角形面积', dd:'medium', tags:'数学,几何', gen(){ const b=rand(1,20);const h=rand(1,20);const a=b*h/2; return {tc:[`${b} ${h}`,Number.isInteger(a)?String(a):a.toFixed(1)]}; } },
    { title:'矩形面积周长', dd:'medium', tags:'数学,几何', gen(){ const l=rand(1,30);const w=rand(1,30); return {tc:[`${l} ${w}`,`${l*w}\n${2*(l+w)}`]}; } },
    { title:'斐波那契第N项', dd:'medium', tags:'循环,数学', gen(){ const n=rand(3,25);let a=1,b=1;for(let i=3;i<=n;i++){const t=a+b;a=b;b=t;} return {tc:[String(n),String(b)]}; } },
    { title:'最大公约数', dd:'medium', tags:'循环,数学', gen(){ const gcd=(a,b)=>b===0?a:gcd(b,a%b);const a=rand(10,100);const b=rand(10,100); return {tc:[`${a} ${b}`,String(gcd(a,b))]}; } },
    { title:'最小公倍数', dd:'medium', tags:'循环,数学', gen(){ const gcd=(a,b)=>b===0?a:gcd(b,a%b);const a=rand(2,30);const b=rand(2,30); return {tc:[`${a} ${b}`,String(a*b/gcd(a,b))]}; } },
    { title:'数组去重', dd:'medium', tags:'数组,去重', gen(){ const n=rand(4,16);const pool=Array.from({length:rand(2,8)},()=>rand(1,20));const a=[];for(let i=0;i<n;i++)a.push(pick(pool)); return {tc:[`${n}\n${a.join(' ')}`,[...new Set(a)].join(' ')]}; } },
    { title:'查找元素位置', dd:'medium', tags:'数组,查找', gen(){ const n=rand(4,15);const a=Array.from({length:n},()=>rand(1,50));const t=rand(0,1)?pick(a):rand(51,99); return {tc:[`${n} ${t}\n${a.join(' ')}`,String(a.indexOf(t))]}; } },
    { title:'绝对值和', dd:'medium', tags:'数组,数学', gen(){ const n=rand(2,15);const a=Array.from({length:n},()=>rand(-100,100));return {tc:[`${n}\n${a.join(' ')}`,String(a.reduce((x,y)=>x+Math.abs(y),0))]}; } },
    { title:'偶数之和', dd:'medium', tags:'数组,条件', gen(){ const n=rand(3,15);const a=Array.from({length:n},()=>rand(1,50));return {tc:[`${n}\n${a.join(' ')}`,String(a.filter(x=>x%2===0).reduce((s,x)=>s+x,0))]}; } },
    { title:'奇数之和', dd:'medium', tags:'数组,条件', gen(){ const n=rand(3,15);const a=Array.from({length:n},()=>rand(1,50));return {tc:[`${n}\n${a.join(' ')}`,String(a.filter(x=>x%2===1).reduce((s,x)=>s+x,0))]}; } },
    { title:'第二大数', dd:'medium', tags:'数组,排序', gen(){ const n=rand(3,12);const a=Array.from({length:n},()=>rand(1,100));const s=[...new Set(a)].sort((x,y)=>y-x);return {tc:[`${n}\n${a.join(' ')}`,String(s[1]||s[0])]}; } },
    { title:'数组众数', dd:'hard', tags:'数组,统计', gen(){ const n=rand(4,12);const pool=[rand(1,5),rand(1,5)];const a=[];for(let i=0;i<n-2;i++)a.push(pick(pool));a.push(pool[0]);a.push(pool[0]); const m={};a.forEach(x=>m[x]=(m[x]||0)+1);const mode=Object.keys(m).sort((x,y)=>m[y]-m[x])[0];return {tc:[`${n}\n${a.join(' ')}`,String(mode)]}; } },
  ];

  const descriptions = {
    '计算数字之和': '给定一个整数列表，计算所有数字之和',
    '找最大值': '给定一个整数列表，找出其中的最大值',
    '找最小值': '给定一个整数列表，找出其中的最小值',
    '计算平均值': '给定一个整数列表，计算其平均值（向下取整）',
    '统计正数个数': '给定一个整数列表，统计其中正数的个数',
    '统计负数个数': '给定一个整数列表，统计其中负数的个数',
    '数组元素翻倍': '将数组中的每个元素乘以 2',
    '数组元素平方': '将数组中的每个元素替换为它的平方值',
    '计算字符串长度': '计算给定字符串的长度',
    '字符串转大写': '将输入的字符串转换为大写字母',
    '字符串转小写': '将输入的字符串转换为小写字母',
    '反转字符串': '将输入的字符串反转',
    '统计元音字母个数': '统计字符串中元音字母（a, e, i, o, u）的数量',
    'A加B': '计算两个整数 A 和 B 的和',
    'A减B': '计算 A 减 B 的结果',
    'A乘B': '计算两个整数的乘积',
    'A除以B': '计算 A 除以 B 的商（整数除法）',
    '取余数': '计算 A 除以 B 的余数',
    '判断奇偶': '判断一个整数是奇数还是偶数。奇数输出 ODD，偶数输出 EVEN',
    '判断正负零': '判断一个整数是正数、负数还是零。正数输出 POSITIVE，负数 NEGATIVE，零 ZERO',
    '两数比较': '比较 A 和 B 的大小关系。A>B 输出 GREATER，A=B 输出 EQUAL，A<B 输出 LESS',
    '打印1到N': '从 1 打印到 N，每个数字一行',
    '升序排列': '将给定的整数列表按升序排列',
    '降序排列': '将给定的整数列表按降序排列',
    '阶乘计算': '计算 N 的阶乘 N! = 1 × 2 × ... × N',
    '判断质数': '判断一个整数是否为质数。是输出 YES，否则输出 NO',
    '三角形面积': '给定三角形的底和高，计算其面积',
    '矩形面积周长': '给定矩形的长和宽，计算其面积和周长',
    '斐波那契第N项': '输出斐波那契数列的第 N 项。F(1)=1, F(2)=1, F(N)=F(N-1)+F(N-2)',
    '最大公约数': '计算两个正整数的最大公约数（GCD）',
    '最小公倍数': '计算两个正整数的最小公倍数（LCM）',
    '数组去重': '去除数组中的重复元素，保持原有顺序',
    '查找元素位置': '在数组中查找目标值第一次出现的位置（从 0 开始）。不存在则输出 -1',
    '绝对值和': '计算数组中所有元素的绝对值之和',
    '偶数之和': '计算数组中所有偶数元素的和',
    '奇数之和': '计算数组中所有奇数元素的和',
    '第二大数': '找出数组中第二大的数。如果所有元素相同，输出该元素',
    '数组众数': '找出数组中出现次数最多的元素（众数）。保证只有一个众数',
  };

  for (let i = 0; i < progTarget; i++) {
    const t = progProblems[i % progProblems.length];
    const seq = Math.floor(i / progProblems.length);
    const title = seq === 0 ? t.title : `${t.title} #${seq + 1}`;

    const g1 = t.gen();
    const g2 = t.gen();
    const g3 = t.gen();
    const testCases = [
      { input: g1.tc[0], expected_output: g1.tc[1] },
      { input: g2.tc[0], expected_output: g2.tc[1] },
      { input: g3.tc[0], expected_output: g3.tc[1] },
    ];

    const r = Math.random();
    let difficulty = t.dd;
    if (r > 0.7) difficulty = r > 0.9 ? 'hard' : 'medium';

    const desc = descriptions[t.title] || t.title;
    insertOne(
      title,
      `## ${title}\n\n### 题目描述\n${desc}\n\n### 输入格式\n第一行包含测试数据\n\n### 输出格式\n输出计算结果`,
      'programming',
      difficulty,
      t.tags,
      '',
      JSON.stringify(testCases),
      '[]',
      '[]'
    );
    if (count % 500 === 0) { process.stdout.write(`\r编程题: ${count}/${progTarget} (${((count/total)*100).toFixed(1)}%)`); }
  }
  process.stdout.write(`\r编程题: ${count}/${progTarget} 完成\n`);

  // ===== 选择题 (3500) =====
  const choiceBases = [
    ['栈的特性是什么？',['先进先出','先进后出','随机访问','按键排序'],1,'数据结构,基础'],
    ['队列的特性是什么？',['先进后出','先进先出','只能从顶端操作','只能从底端操作'],1,'数据结构,基础'],
    ['数组的索引通常从什么开始？',['1','0','-1','任意值'],1,'数据结构,数组'],
    ['单向链表每个节点至少包含几个部分？',['1','2','3','4'],1,'数据结构,链表'],
    ['二叉搜索树中，左子树所有节点的值比根节点？',['大','小','相等','不确定'],1,'数据结构,树'],
    ['冒泡排序的平均时间复杂度是？',['O(n)','O(n log n)','O(n²)','O(log n)'],2,'算法,排序'],
    ['快速排序的平均时间复杂度是？',['O(n²)','O(n)','O(log n)','O(n log n)'],3,'算法,排序'],
    ['二分查找的前提条件是什么？',['数组无序','数组有序','链表结构','数据量大'],1,'算法,搜索'],
    ['二分查找的时间复杂度是？',['O(1)','O(n)','O(log n)','O(n²)'],2,'算法,搜索'],
    ['动态规划的核心思想是什么？',['分治','贪心','状态转移','暴力枚举'],2,'算法,DP'],
    ['typeof null 的结果是什么？',['null','undefined','object','number'],2,'JavaScript,基础'],
    ['JavaScript 中声明变量的关键字不包括？',['var','let','const','int'],3,'JavaScript,基础'],
    ['Promise 的状态不包括？',['pending','fulfilled','rejected','completed'],3,'JavaScript,异步'],
    ['Python 中列表使用什么符号？',['{}','[]','()','<>'],1,'Python,基础'],
    ['Python 中定义函数的关键字是？',['function','def','fun','lambda'],1,'Python,基础'],
    ['HTTP 状态码 404 表示什么？',['请求成功','服务器错误','页面未找到','重定向'],2,'网络,HTTP'],
    ['HTTP 状态码 200 表示什么？',['请求成功','未授权','服务器错误','请求错误'],0,'网络,HTTP'],
    ['TCP 和 UDP 的主要区别？',['TCP更快','TCP面向连接','UDP更可靠','UDP有序传输'],1,'网络,协议'],
    ['DNS 的作用是什么？',['加密数据','域名解析为IP','路由选择','错误检测'],1,'网络,协议'],
    ['HTTPS 默认使用哪个端口？',['80','443','8080','3000'],1,'网络,协议'],
    ['操作系统的主要功能不包括？',['进程管理','内存管理','用户界面设计','文件管理'],2,'操作系统,基础'],
    ['虚拟内存的作用是什么？',['加速CPU','扩展物理内存','增加硬盘容量','提高网速'],1,'操作系统,内存'],
    ['SQL 中查询数据的关键字是？',['INSERT','SELECT','UPDATE','DELETE'],1,'数据库,SQL'],
    ['SQL 中删除表所有行但保留表结构的命令是？',['DELETE','TRUNCATE','DROP','REMOVE'],1,'数据库,SQL'],
    ['数据库索引的主要作用是？',['节省存储','加速查询','保证安全','简化SQL'],1,'数据库,索引'],
    ['ACID 中的 A 代表什么？',['可用性','原子性','可访问性','异步性'],1,'数据库,事务'],
    ['ACID 中的 I 代表什么？',['完整性','隔离性','独立性','继承性'],1,'数据库,事务'],
    ['HTML 中最大的标题标签是？',['h6','h1','title','header'],1,'前端,HTML'],
    ['CSS 设置背景颜色的属性是？',['color','font-size','background-color','border'],2,'前端,CSS'],
    ['CSS 盒模型从内到外的顺序？',['margin-border-padding-content','content-padding-border-margin','padding-content-margin-border','border-margin-content-padding'],1,'前端,CSS'],
    ['React 管理组件状态的是？',['props','state','context','ref'],1,'前端,React'],
    ['React 虚拟DOM的主要优势？',['减少网络请求','提高首次渲染','减少真实DOM操作','压缩代码'],2,'前端,React'],
    ['1 byte 等于多少 bit？',['4','8','16','32'],1,'计算机基础'],
    ['JSON 的全称是？',['Java Source Object Notation','JavaScript Object Notation','Java Standard Open Network','JavaScript Open Network'],1,'计算机基础'],
    ['单例模式保证类有几个实例？',['0个','1个','多个','由参数决定'],1,'设计模式'],
    ['OOP三大特性不包括？',['封装','继承','多态','函数式'],3,'OOP'],
    ['Dijkstra算法用于解决什么问题？',['最小生成树','单源最短路径','拓扑排序','最大流'],1,'算法,图论'],
    ['Prim算法用于解决什么问题？',['最短路径','最小生成树','强连通分量','欧拉回路'],1,'算法,图论'],
    ['OSI七层模型中网络层是第几层？',['1','2','3','4'],2,'网络,OSI'],
    ['下列哪种调度算法会导致饥饿？',['先来先服务','短作业优先','轮转调度','公平分享'],1,'操作系统,调度'],
    ['哈希表解决冲突的方法不包括？',['链地址法','开放地址法','再哈希法','冒泡法'],3,'数据结构,哈希'],
    ['Python中tuple和list的主要区别？',['tuple更快','tuple不可变','tuple不能包含不同','tuple无索引'],1,'Python'],
    ['编译器将源代码翻译成什么？',['汇编代码','机器码或中间代码','伪代码','自然语言'],1,'编译原理'],
    ['满二叉树第k层最多多少个节点？',['k','2k','2^(k-1)','k^2'],2,'数据结构,树'],
    ['箭头函数与普通函数区别不包括？',['没有this','不能作构造函数','不能使用arguments','不能有参数'],3,'JavaScript'],
    ['数据库三大范式不包括？',['原子性','主键依赖','传递依赖','性能优化'],3,'数据库,设计'],
  ];

  for (let i = 0; i < choiceTarget; i++) {
    const base = choiceBases[i % choiceBases.length];
    const seq = Math.floor(i / choiceBases.length);
    const title = seq === 0 ? base[0] : `${base[0]} #${seq + 1}`;
    const d = Math.random();
    const diff = d < 0.35 ? 'easy' : d < 0.7 ? 'medium' : 'hard';

    insertOne(
      title,
      `## ${title}\n\n请选择正确的答案。`,
      'choice',
      diff,
      base[3],
      String(base[2]),
      '[]',
      JSON.stringify(base[1]),
      '[]'
    );
    if (count % 500 === 0) { process.stdout.write(`\r选择题: ${count - progTarget}/${choiceTarget} (${((count/total)*100).toFixed(1)}%)`); }
  }
  process.stdout.write(`\r选择题: ${count - progTarget}/${choiceTarget} 完成\n`);

  // ===== 填空题 (3000) =====
  const fillBases = [
    ['声明常量的关键字是 ___',['const'],'JavaScript','const 用于声明常量'],
    ['在控制台输出信息的方法是 console.___()',['log'],'JavaScript','console.log() 是最常用的调试输出'],
    ['typeof ___ 会返回 "undefined"',['undefined'],'JavaScript','typeof 对未定义值返回 undefined'],
    ['将字符串转为整数的函数是 ___()',['parseInt'],'JavaScript','parseInt() 解析字符串并返回整数'],
    ['ES6中定义块级作用域变量的关键字是 ___',['let'],'JavaScript','let 和 const 支持块级作用域'],
    ['___ 函数将JSON字符串转换为JS对象',['JSON.parse'],'JavaScript','JSON.parse() 解析 JSON'],
    ['___ 方法创建一个新数组，包含每个元素调用函数后的返回值',['map'],'JavaScript','Array.map() 用于映射转换'],
    ['输出信息到控制台的函数是 ___()',['print'],'Python','print() 是标准输出函数'],
    ['获取用户输入的函数是 ___()',['input'],'Python','input() 读取键盘输入'],
    ['获取列表长度的函数是 ___()',['len'],'Python','len() 返回对象的长度'],
    ['定义类的关键字是 ___',['class'],'Python','class 定义类'],
    ['导入模块的关键字是 ___',['import'],'Python','import 导入模块'],
    ['栈的插入和删除都在同一端，这端叫 ___',['栈顶'],'数据结构','栈顶是操作位置'],
    ['队列的插入在队尾，删除在 ___',['队头','队首'],'数据结构','队头是删除端'],
    ['链表中每个元素称为 ___',['节点','结点'],'数据结构','节点是基本单元'],
    ['二叉树每个节点最多有 ___ 个子节点',['2','两','两个'],'数据结构','二叉树最多两个子节点'],
    ['___ 查找要求数据必须有序',['二分'],'算法','二分查找前提是有序'],
    ['___ 排序的基本思想是每次选最小的元素',['选择'],'算法','选择排序每次选最小'],
    ['___ 排序通过相邻元素比较和交换',['冒泡'],'算法','冒泡通过相邻比较交换'],
    ['HTTP 默认端口号是 ___',['80'],'网络','HTTP 默认 80 端口'],
    ['___ 协议用于安全传输文件',['SFTP','FTPS'],'网络','安全文件传输协议'],
    ['___ 地址是分配给网络设备的唯一标识',['IP'],'网络','IP 地址标识设备'],
    ['TCP通过 ___ 次握手建立连接',['三','3','三次'],'网络','三次握手建立连接'],
    ['___ 是计算机系统中最重要的系统软件',['操作系统'],'操作系统','操作系统管理资源'],
    ['___ 现象指进程相互等待资源',['死锁'],'操作系统','死锁导致永远等待'],
    ['SQL中 ___ 语句用于插入数据',['INSERT'],'数据库','INSERT INTO 添加记录'],
    ['SQL中 ___ 语句用于修改数据',['UPDATE'],'数据库','UPDATE SET 修改记录'],
    ['___ 键用于唯一标识表中的每一行',['主'],'数据库','主键唯一标识行'],
    ['___ JOIN 返回两个表中匹配的行',['INNER'],'数据库','INNER JOIN 匹配行'],
    ['Git 中 ___ 命令将文件加入暂存区',['add','git add'],'工具','git add 暂存修改'],
    ['Git 中 ___ 命令提交修改到仓库',['commit','git commit'],'工具','git commit 创建提交'],
    ['___ 是一种将数据和操作封装的思想',['面向对象','OOP'],'编程','OOP 封装数据和行为'],
    ['正则表达式中 ___ 匹配任意单个字符',['.'],'编程','点号匹配任意字符'],
    ['___ 设计模式确保只有一个实例',['单例','单例模式'],'设计模式','单例限制实例化'],
    ['___ 树是自平衡二叉搜索树',['AVL'],'数据结构','AVL 树自平衡'],
    ['___ 是网络攻击使服务器过载',['DDoS','DDOS','拒绝服务'],'安全','DDoS 分布式拒绝服务'],
    ['___ 调度给每个进程固定时间片',['轮转','时间片轮转'],'操作系统','轮转均分 CPU'],
    ['Python列表推导式使用 ___ 来写',['[]'],'Python','列表推导式语法 [x for x in ...]'],
    ['最小堆中堆顶元素是 ___',['最小值','最小'],'数据结构','堆顶是最小值'],
    ['___ 算法用于加权连通图中找最小生成树',['Kruskal','Prim','克鲁斯卡尔','普里姆'],'算法','MST算法'],
  ];

  for (let i = 0; i < fillTarget; i++) {
    const base = fillBases[i % fillBases.length];
    const seq = Math.floor(i / fillBases.length);
    const title = seq === 0 ? base[0] : `${base[0]} #${seq + 1}`;
    const d = Math.random();
    const diff = d < 0.35 ? 'easy' : d < 0.7 ? 'medium' : 'hard';

    insertOne(
      title,
      `## ${title}\n\n请将正确答案填入输入框。`,
      'fill_blank',
      diff,
      base[2],
      base[3],
      '[]',
      '[]',
      JSON.stringify(base[1])
    );
    if (count % 500 === 0) { process.stdout.write(`\r填空题: ${count - progTarget - choiceTarget}/${fillTarget} (${((count/total)*100).toFixed(1)}%)`); }
  }

  // 添加索引
  console.log('创建索引...');
  db.run('CREATE INDEX IF NOT EXISTS idx_problems_type ON problems(type)');
  db.run('CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty)');
  db.run('CREATE INDEX IF NOT EXISTS idx_problems_title ON problems(title)');
  db.run('CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id, problem_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status)');
  saveDb();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n===== 题库生成完成 =====`);
  console.log(`总计: ${total} 道题目 | 编程: ${progTarget} | 选择: ${choiceTarget} | 填空: ${fillTarget}`);
  console.log(`耗时: ${elapsed}s | 平均: ${(total / parseFloat(elapsed)).toFixed(0)} 题/秒`);
}

(async () => {
  await seed();
  process.exit(0);
})();

