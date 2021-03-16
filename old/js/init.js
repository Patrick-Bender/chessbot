var table = document.createElement("table");
table.id = 'board'
const FEN_Start = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
var i_FEN = 0
const pieces = new Set(['r', 'n', 'b', 'q', 'k', 'p', 'R', 'N', 'B', 'Q', 'K', 'P']);
function getBoardFromFEN(FEN){
	var map = [];
	for (var i = 0; i<64; i++){
		map.push('');
	}
	var id = 56;
	const pieces = new Set(['r', 'n', 'b', 'q', 'k', 'p', 'R', 'N', 'B', 'Q', 'K', 'P']);
	var i = 0;
	while (FEN.charAt(i) != ' '){
		var ch = FEN.charAt(i)
		if (pieces.has(ch)){
			map[id] = ch;
			id += 1
		}else if(ch == '/'.charAt(0)){
			id -= 16;
		}else if(ch >= '0'.charAt(0) && ch <= '9'.charAt(0)){
			id += Number(ch);
		}
		i++;
	}
	return map;
}
 
for (var i = 0; i < 8; i++) {
	var tr = document.createElement('tr');
	for (var j = 0; j < 8; j++) {
		var td = document.createElement('td');
		if (i%2 == j%2) {
			td.className = "white square";
			td.id = 8*(7-i) + j;

		} else {
			td.className = "black square";
			td.id = 8*(7-i) + j;
		}
		td.addEventListener("click", placePiece);
		td.innerHTML = td.id
		tr.appendChild(td);
	}
	table.appendChild(tr);
}
document.body.appendChild(table);
pieceMap = getBoardFromFEN(FEN_Start);
for (var i = 0; i < 64; i++){
	if (pieces.has(pieceMap[i])) document.getElementById(i).innerHTML = '<img class = "piece" id = "' + i + pieceMap[i] + '" onclick = "pickPiece(this)" src = img/' + pieceMap[i] + '.svg>';

}

