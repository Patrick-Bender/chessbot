var selectedPiece = '';
var selectedId = '';
function getRookMoves(id){

}
function getBishopMoves(id){

}
function getKingMoves(id){

}
function getQueenMoves(id){
        return getRookMoves(id).concat(getBishopMoves(id));
}
function getKnightMoves(id){

}
function getPawnMoves(id){

}
function getLegalMoves(id, type){
        //make all legal moves
        return Array.from({length: 64}, (item, index) => index);
        if (Set(['r', 'R']).has(type)){
                return getRookMoves(id)
        }else if (Set(['b', 'B']).has(type)){
                return getBishopMoves(id)
        }else if (Set(['n', 'N']).has(type)){
                return getKnightMoves(id)
        }else if (Set(['q', 'Q']).has(type)){
                return getQueenMoves(id)
        }else if (Set(['k', 'K']).has(type)){
                return getKingMoves(id)
        }else if (Set(['p', 'P']).has(type)){
                return getPawnMoves(id)
        }else{
                alert("Something has gone wrong with get legal moves function")
        }




}
function getAllLegalMoves(){
        var map = [];
        for (var id = 0; id < 64; id++){
                map.push(getLegalMoves(id))
        }
        return map
}
function highlightLegalMoves(squares){
        var highlight = function (id) {document.getElementById(id).classList.add("highlighted")};
        squares.forEach(highlight);
}
function unhighlightEverything(){
        var unhighlight = function (id) {document.getElementById(id).classList.remove("highlighted")};
        Array.from({length: 64}, (item, index) => index).forEach(unhighlight);
}
function pickPiece(img){
        var id = img.parentNode.id;
        var type = img.id.charAt((img.id.length)-1);
        highlightLegalMoves(getLegalMoves(id, type));
        selectedPiece = type;
	selectedId = id;
}
function placePiece(td){
	console.log("placing piece");
	var id = td.id;
	console.log(td);
        if (selectedPiece != ''){
                console.log("unhighlighting");
                unhighlightEverything();
		document.getElementById(id).innerHTML = '<img class = "piece" id = "' + id + selectedPiece + '" onclick = "pickPiece(this)" src = img/' + selectedPiece + '.svg>';
        	selectedPiece = '';
	}
}

