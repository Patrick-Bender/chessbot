import './App.css';
import React from 'react';
import r_b from "./img/r.svg";
import n_b from "./img/n.svg";
import b_b from "./img/b.svg";
import q_b from "./img/q.svg";
import k_b from "./img/k.svg";
import p_b from "./img/p.svg";
import r_w from "./img/R.svg";
import n_w from "./img/N.svg";
import b_w from "./img/B.svg";
import q_w from "./img/Q.svg";
import k_w from "./img/K.svg";
import p_w from "./img/P.svg";

function legalMovesCheckSide(currentSide, squareSide){
	let add;
	let stop;
	if (squareSide === 'empty'){
		add = true;
		stop = false;
	}else if(squareSide === currentSide){
		add = false;
		stop = true;
	}else{
		add = true;
		stop = true;
	}
	return [add, stop]
}
function getAllLegalMoves(FEN){
	return fetch('https://localhost:3001?FEN=' + FEN, {
		method: "GET",
		headers: new Headers({
			"Access-Control-Allow-Origin": "*",
		}),
	}).catch((err) => {
	  if(typeof err === 'string') err = new Error(err)
	  console.error(err)
	})
}
function getMove(FEN){
	return fetch("localhost:3001/move-request?FEN=" + FEN)
}
function getNumSquaresToEdge(){
	var numSquaresToEdge = new Array(64);
	for (var file = 0; file < 8; file ++){
		for (var rank = 0; rank < 8; rank ++){
			var numNorth = rank;
			var numSouth = 7-rank;
			var numWest = file;
			var numEast = 7-file;
			var squareIndex = rank*8+file
			numSquaresToEdge[squareIndex] = new Map();
			numSquaresToEdge[squareIndex].set(-8, numNorth);
			numSquaresToEdge[squareIndex].set(8, numSouth);
			numSquaresToEdge[squareIndex].set(-1, numWest);
			numSquaresToEdge[squareIndex].set(1, numEast);
			numSquaresToEdge[squareIndex].set(-9, Math.min(numNorth, numWest));
			numSquaresToEdge[squareIndex].set(-7, Math.min(numNorth, numEast));
			numSquaresToEdge[squareIndex].set(9, Math.min(numSouth, numEast));
			numSquaresToEdge[squareIndex].set(7, Math.min(numSouth, numWest));
		}
	}
	return numSquaresToEdge
}
function Square(props){
	var classes = "square";
	((Math.floor(props.id/8) + (props.id % 8)) % 2 !== 0) ? classes += " black" : classes += " white"; 
	(props.isHighlighted) ? classes += " highlighted" : classes += "";
	let imgMap = new Map();
	imgMap.set('r', r_b);
	imgMap.set('n', n_b);
	imgMap.set('b', b_b);
	imgMap.set('q', q_b);
	imgMap.set('k', k_b);
	imgMap.set('p', p_b);
	imgMap.set('R', r_w);
	imgMap.set('N', n_w);
	imgMap.set('B', b_w);
	imgMap.set('Q', q_w);
	imgMap.set('K', k_w);
	imgMap.set('P', p_w);
	let imgsrc;
	(props.piece !== '') ? imgsrc = imgMap.get(props.piece) : imgsrc = '';
	//imgsrc = require("./logo.svg");
	return (
		<button className={classes} onClick={props.onClick}>
			<img className="piece" src={imgsrc} alt={props.piece}></img>
			{props.id}
		</button>
	);
}
function getSideFromPiece(piece){
	if (new Set(['r', 'n', 'b', 'q', 'k', 'p']).has(piece)){
		return 'black'
	}else if (new Set(['R', 'N', 'B', 'Q', 'K', 'P']).has(piece)){
		return 'white'
	}else{
		return 'empty'
	}
}
function getBoardFromFEN(FEN){
        var map = [];
        for (var i = 0; i<64; i++){
                map.push('');
        }
        var id = 0;
        const pieces = new Set(['r', 'n', 'b', 'q', 'k', 'p', 'R', 'N', 'B', 'Q', 'K', 'P']);
        var i = 0;
        while (FEN.charAt(i) !== ' '){
		var ch = FEN.charAt(i)
                if (pieces.has(ch)){
                        map[id] = ch;
                        id += 1;
                }else if(ch >= '0'.charAt(0) && ch <= '9'.charAt(0)){
                        id += Number(ch);
                }
                i++;
        }
        return map;
}
function calculateWinner(squares){
	return null;
	//can also return "draw"
}
function range(start, end) {
  return Array(end - start + 1).fill().map((_, idx) => start + idx)
}
class Board extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			boardSize: 8,
		};
	}
	renderSquare(i) {
		return (<Square 
			isHighlighted={this.props.highlighted.has(i)}
			id={i}
			piece={this.props.squares[i]}
			onClick={() => this.props.onClick(i)}
		/>);
	}
	renderRow(rowNumber){
		const colNumbers = Array.from(Array(this.state.boardSize).keys());
		const squares = colNumbers.map((colNumber) =>
			this.renderSquare(rowNumber*this.state.boardSize + colNumber)
		);


		return(<div className="board-row">{squares}</div>);

	}
	render(){
		const numbers = Array.from(Array(this.state.boardSize).keys());
		const rows = numbers.map((number) =>
			this.renderRow(number)
		);
		return(
			<div>{rows}</div>
		)	
	}

}

class Game extends React.Component{
	constructor(props) {
		super(props);
		this.state = {
			history: [{
				FEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
				squares: getBoardFromFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"),
				whiteShortCastle: true,
				whiteLongCastle: true,
				blackShortCastle: true,
				blackLongCastle: true,
				enPassantTarget: null,
			}],
			whiteTurn: true,
			stepNumber: 0,
			selectedPiece: null,
			selectedID: null,
			numSquaresToEdge: getNumSquaresToEdge(),
		};
	}
	getSlidingMoves(id){
		const vertAndHor = [8, -8, 1, -1];
		const diagonals = [7,9,-7,-9];
		const squares = this.state.history[this.state.stepNumber].squares;
		const boundaries = new Set([0,1,2,3,4,5,6,7,8,15,23,31,39,47,55,63,62,61,60,59,58,57,56,48,40,32,24,16,8])
		const friendlySide = getSideFromPiece(squares[id]);
		var legalMoves = new Set();
		var dirs = [];
		var pointer = id
		let add;
		let stop;
		if (new Set(['b', 'B', 'q', 'Q']).has(squares[id])){
			diagonals.forEach(dir => dirs.push(dir))
		}
		if (new Set(['r', 'R', 'q', 'Q']).has(squares[id])){
			vertAndHor.forEach(dir => dirs.push(dir))
		}
		for (let dir of dirs){
			//var dir = dirs[d];
			pointer = id+dir;
			for (var i = 0; i < this.state.numSquaresToEdge[id].get(dir); i++){
				[add, stop] = legalMovesCheckSide(friendlySide, getSideFromPiece(squares[pointer]));	
				if (add) legalMoves.add(pointer);
				if (stop) break;
				pointer += dir;
			}
		}
		legalMoves.delete(id);
		return legalMoves
	}
	
	getKnightMoves(id){
		const paths = [[-1,-2,-10], [-1,-2,6], [-8,-16,-17], [-8,-16,-15], [1,2,-6], [1,2,10], [8,16,17], [8,16,15]]
		const squares = this.state.history[this.state.stepNumber].squares;
		const boundaries = new Set([0,1,2,3,4,5,6,7,8,15,23,31,39,47,55,63,62,61,60,59,58,57,56,48,40,32,24,16,8])
		const friendlySide = getSideFromPiece(squares[id]);
		var legalMoves = new Set();
		for (let path of paths){
			var [allowed,] = legalMovesCheckSide(friendlySide, getSideFromPiece(squares[id+path[2]]));
			var lastPointer = id;
			for (let position of path){
				var pointer = id+position;
				var lastRow = Math.floor(lastPointer/8);
				var lastFile = lastPointer % 8;
				var currentRow = Math.floor(pointer/8);
				var currentFile = pointer % 8;
				if (Math.abs(currentRow-lastRow) > 1) allowed = false
				if (Math.abs(currentFile-lastFile) > 1) allowed = false
				if (Math.abs(currentRow-lastRow) >= 1 && Math.abs(currentFile-lastFile) >= 1) allowed = false
				lastPointer = pointer;
			}
			if (allowed) legalMoves.add(id+path[2]);
		}
		return legalMoves
	}
	getKingMoves(id){
		const positions = [8, -8, 1, -1, 7, 9, -7, -9];
		const squares = this.state.history[this.state.stepNumber].squares;
		const friendlySide = getSideFromPiece(squares[id]);
		var legalMoves = new Set();
		let allowed;
		let pointer;
		for (var d = 0; d < positions.length; d++){
			pointer = id+positions[d];
			[allowed, ] = legalMovesCheckSide(friendlySide, getSideFromPiece(squares[pointer]))
			if (this.state.numSquaresToEdge[id].get(positions[d]) == 0) allowed = false;
			if (allowed) legalMoves.add(pointer)
		}
		return legalMoves
	}
	getPawnMoves(id){
		const squares = this.state.history[this.state.stepNumber].squares;
		const friendlySide = getSideFromPiece(squares[id]);
		let direction;
		(friendlySide === 'white') ? direction = 1 : direction = -1;
		var positions = new Array();
		//add 1 move forward if not blocked
		if (getSideFromPiece(squares[id-(8*direction)]) === 'empty') positions.push(-8)
		//add 2 move foward if on starting row
		if (direction === 1 && new Set(range(48, 55)).has(id)){
			positions.push(-16);
		}else if (direction === -1 && new Set(range(8,15)).has(id)){
			positions.push(-16);
		}
		//check if it can capture on left or right
		const rightSide = getSideFromPiece(squares[id+(-7*direction)])
		const leftSide = getSideFromPiece(squares[id+(-9*direction)])
		if (rightSide !== friendlySide && rightSide !== 'empty'){
			positions.push(-7);
		}
		if (leftSide !== friendlySide && leftSide !== 'empty'){
			positions.push(-9);
		}
		const legalMoves = new Set(positions.map((position) => id+(position*direction)));
		return legalMoves
	}
	getLegalMoves(id, piece){
		if (id !== null && piece !== ''){
			if (new Set(['r', 'R', 'b', 'B', 'q', 'Q']).has(piece)){
				return this.getSlidingMoves(id)
			}else if (new Set(['n', 'N']).has(piece)){
				return this.getKnightMoves(id)
			}else if (new Set(['k', 'K']).has(piece)){
				return this.getKingMoves(id)
			}else if (new Set(['p', 'P']).has(piece)){
				return this.getPawnMoves(id)
			}else{
				console.log("Something has gone wrong with get legal moves function")
				return new Set();
			}

		}else{
			return new Set()
		}
	}
	makeRandomMove(side){
		const history = this.state.history.slice(0, this.state.stepNumber+1);
		const current = history[history.length-1];
		var squares = current.squares.slice();
		var possibleMoves = new Array(64);
		if (side == 'black'){
			var possiblePieces = new Set(['r', 'b', 'q', 'n', 'k', 'p'])
		}
		else if (side == 'white'){
			var possiblePieces = new Set(['R', 'B', 'Q', 'N', 'K', 'P'])
		}
		else{
			throw new Error("Make random move was given a side that was not black or white");
		}
		for (var i = 0; i < 64; i++){
			possibleMoves.append(this.getLegalMoves(i, squares[i]));
		}
		console.log(possibleMoves);
	}
	handleClick(i){
		console.log(getAllLegalMoves("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"))
		const history = this.state.history.slice(0, this.state.stepNumber+1);
		const current = history[history.length-1];
		var squares = current.squares.slice();
		const selectedPiece = this.state.selectedPiece;
		const selectedID = this.state.selectedID;
		if (calculateWinner(squares)) {
			return;
		}
		//if already selected a piece
		else if(selectedPiece && selectedID != null){
			//if clicking on selected piece deselect it
			if (selectedID == i){
				this.setState({
					selectedPiece: null,
					selectedID: null,
				});
			}
			//if i is a legal move
			else if (this.getLegalMoves(selectedID, selectedPiece).has(i)){
				squares[selectedID] = "";
				squares[i] = selectedPiece;
				this.setState({
					history: history.concat([{
						squares: squares,
					}]),
					whiteTurn: !this.state.whiteTurn,
					stepNumber: history.length,
					selectedPiece: null,
					selectedID: null,
				});
			
			}

		}
		else if (this.getLegalMoves(i, squares[i]).size !== 0 && (this.state.whiteTurn === (getSideFromPiece(squares[i]) === 'white'))){
			this.setState({
				selectedPiece: squares[i],
				selectedID: i,
			});
		}
		
	}
	jumpTo(step){
		this.setState({
			stepNumber: step,
			whiteTurn: (step % 2) === 0,
		});
	}
	render(){
		const history = this.state.history;
		const current = history[this.state.stepNumber];
		const winner = calculateWinner(current.squares);
		const moves = history.map((step, move) => {
			const desc = move ?
				'Go to move #' + move:
				'Go to game start';
			if (move === this.state.stepNumber){
				return (
					<li key = {move}>
						<button onClick={() => this.jumpTo(move)}><b>{desc}</b></button>
					</li>
				);
			}else{
				return(
					<li key = {move}>
						<button onClick={() => this.jumpTo(move)}>{desc}</button>
					</li>

				);
			}
		});
		let status;
		if (winner === "draw"){
			status = "Draw";
		}
		else if (winner){
			status = 'Winner: ' + winner;
		}
		else {
			status = (this.state.whiteTurn ? 'White': 'Black') + "'s turn";
		}
		return(
			<div className="game">
				<div className = "game-board">
				<Board 
					squares={current.squares}
					highlighted={this.getLegalMoves(this.state.selectedID, this.state.selectedPiece)}
					onClick={(i) => this.handleClick(i)}
				/>
				</div>
				<div className = "game-info">
					<div>{status}</div>
					<ol>
						{moves}
					</ol>
				</div>
			</div>
		);
	}
}

function App() {
  return (
  	<Game />
  );
}

export default App;
