(ns rest-api.core
  (:require [org.httpkit.server :as server]
            [compojure.core :refer :all]
            [compojure.route :as route]
            [ring.core.protocols :refer :all]
            [ring.adapter.jetty :refer :all]
            [ring.middleware.params :refer :all]
            [clojure.string :as s]
            [clojure.pprint :as pp]
            [clojure.data.json :as json])
  (:gen-class))
(def boundaries (set '(0,1,2,3,4,5,6,7,8,15,23,31,39,47,55,63,62,61,60,59,58,57,56,48,40,32,24,16,8)))
(def lengthToEdge
  (to-array 
    (for [rank (range 8) file (range 8)]
      (let [north rank
            south (- 7 rank)
            west file
            east (- 7 file)]
        (hash-map
            -8 north
            8 south
            -1 west
            1 east
            -9 (min north west)
            -7 (min north east)
            9 (min south east)
            7 (min south west)
        )
      )
    )
  )
)
(defn getSide [square]
  (cond
    (contains? (set '(\r \n \b \q \k \p)) square) -1
    (contains? (set '(\R \N \B \Q \K \P)) square) 1
    :default 0
  )
)
(defn getIdFromRankAndFile [rankAndFile]
  (let [file (first (get (s/split rankAndFile #"") 0))
        rank (first (get (s/split rankAndFile #"") 1))]
    (println (- (int file) 97) " " (- 7 (- (int rank) 49)))
    (+ (- (int file) 97) (* 8 (- 7 (- (int rank) 49))))))

  

(defn getKingMoves [id squares castling]
  (let [checkCastelClear (fn [start end] (every? (fn [pointer] (= "" (get squares pointer))) (range (+ 1 start) end)))
        ;order is whiteLong, whiteShort, blackLong, blackShort
        clearChecks [(checkCastelClear 56 60) (checkCastelClear 60 63) (checkCastelClear 0 4) (checkCastelClear 4 7)]
        castlingCheck [(contains? castling "Q") (contains? castling "K") (contains? castling "q") (contains? castling "k")]
        rookCheck [(= \R (get squares 56)) (= \R (get squares 63)) (= \r (get squares 0)) (= \r (get squares 7))]
        canCastle (mapv (fn [one two three] (and (and one two) three)) clearChecks castlingCheck rookCheck)
        side (getSide (get squares id))
        castleAnswers (cond
                   (= 1 side)
                    (cond 
                      (and (get canCastle 0) (get canCastle 1)) '[62 58]
                      (get canCastle 0) '[58]
                      (get canCastle 1) '[62]
                      :else '[])
                   (= -1 side)
                    (cond
                      (and (get canCastle 2) (get canCastle 3)) '[2 6]
                      (get canCastle 2) '[2]
                      (get canCastle 3) '[6]
                      :else '[]) 
                   :else '[])
        dirs (filterv (fn [x] (and (>= (+ id x) 0) (<= (+ id x) 63))) '[-8 8 -1 1 -9 9 -7 7])]
    (loop [i_dirs 0
           answers castleAnswers]
      (cond
        (= i_dirs (count dirs)) answers
        (not= side (getSide (get squares (+ id (get dirs i_dirs))))) (recur (inc i_dirs) (conj answers (+ id (get dirs i_dirs))))
        :else (recur (inc i_dirs) answers)
        )
      )
    )    
  )



(defn getSlidingMoves [id squares]
  
  (let [dirs (cond 
               (contains? (set '(\Q \q)) (get squares id)) '[8 -8 1 -1 7 -7 9 -9]
               (contains? (set '(\B \b)) (get squares id)) '[7 -7 9 -9]
               (contains? (set '(\R \r)) (get squares id)) '[8 -8 1 -1]
               :else (throw (Exception. (str "Called get sliding moves for non-sliding piece with id: " id)))
              )
        checkDir (fn [id dir squares side]
                (loop [answers '[]
                       distance 1]
                      (let [pointer (+ id (* distance dir))
                            pointerSide (getSide (get squares pointer))]
                        (cond
                          (= side pointerSide) answers
                          (= (* -1 side) pointer side) (conj answers pointer)
                          (<= (get (get lengthToEdge id) dir) distance) (conj answers pointer)
                          :else (recur (conj answers pointer) (+ distance 1))))))
            ]
    (reduce concat (for [dir dirs] (checkDir id dir squares (getSide (get squares id)))))
    )
)
(defn getPawnMoves [id squares enPassant]
  (let [side (getSide (get squares id))
        enPassantTarget (if (= enPassant "-") 
                          -1
                          (getIdFromRankAndFile enPassant))
        enPassantAnswers
          (cond 
            (= side -1) 
              (if (or (= enPassantTarget (+ id 7)) (= enPassantTarget (+ id 9)))
                [enPassantTarget]
                [])
            (= side 1)
              (if (or (= enPassantTarget (+ id -7)) (= enPassantTarget (+ id -9)))
                [enPassantTarget]
                []))
        advanceChecks (if (= side 1) [(+ id -8) (+ id -16)] [(+ id 8) (+ id 16)])
        captureChecks (if (= side 1) [(+ id -7) (+ id -9)] [(+ id 7) (+ id 9)])
        advancing (cond
                    (and (= 0 (getSide (get squares (get advanceChecks 0)))) (= 0 (getSide (get squares (get advanceChecks 1))))) [(get advanceChecks 0) (get advanceChecks 1)]
                    (= 0 (getSide (get squares (get advanceChecks 0)))) [(get advanceChecks 0)]
                    :else [])
        capturing (cond
                      (and 
                        (= (* -1 side) (getSide (get squares (get captureChecks 0)))) 
                        (= (* -1 side) (getSide (get squares (get captureChecks 1))))) 
                          [(get captureChecks 0) (get captureChecks 1)]
                      (= (* -1 side) (getSide (get squares (get captureChecks 0)))) [(get captureChecks 0)]
                      (= (* -1 side) (getSide (get squares (get captureChecks 1)))) [(get captureChecks 1)]
                      :else [])
          ]
          (concat enPassantAnswers advancing capturing))
  )
(defn abs [n] (max n (- n)))
(defn getKnightMoves [id squares]
  (let [pathOffsets [[0 8 16 17] [0 8 16 15] [0 -1 -2 6] [0 -1 -2 -10] [0 -8 -16 -17] [0 -8 -16 -15] [0 1 2 -6] [0 1 2 10]]
        side (getSide (get squares id))
        validEnd? (fn [path] (not= side (getSide (get squares (last path)))))
        paths (filter validEnd? (mapv (fn [pathOffset] (mapv + (repeat id) pathOffset)) pathOffsets))
        row (fn [x] (int (Math/floor (/ x 8))))
        col (fn [x] (mod x 8))
        validPath? (fn [path] (println path)
                                (loop [i 1]
                                  
                                (cond 
                                 (= (count path) i) true
                                 (or 
                                   (< 1 (abs (- (col (path i)) (col (path (- i 1))))))
                                   (< 1 (abs (- (row (path i)) (row (path (- i 1)))))))
                                    false
                                 :else (recur (inc i)))))]
    (mapv last (filterv validPath? paths))
  )
)

(defn truthy? [s]
  (cond
    (contains? (set '("false" "False" "f" "F")) s) false
    (contains? (set '("true" "True" "t" "T")) s) true
    :default (throw (Exception. (str "Truthy? could not evaluate the string: " s)))))

(defn FENtoSquares [FEN & {:keys [squares] :or {squares '[]}}]
  (loop [FEN FEN
         squares squares]
    (cond
      (or (= \space (get FEN 0)) (= 0 (count FEN))) squares
      (= \/ (get FEN 0)) (recur (subs FEN 1 (count FEN)) squares)
      (not= nil (re-find #"[0-9]" (str (get FEN 0)))) (recur (subs FEN 1 (count FEN)) (vec (concat squares (repeat (- (int (get FEN 0)) 48) ""))))
      :default (recur (subs FEN 1 (count FEN)) (conj squares (get FEN 0)))
      )
    )
  )

(defn get-legal-moves [id squares castling enPassant]
  (let [square (get squares id)]
    (cond 
      (contains? (set '(\K \k "K" "k")) square) (getKingMoves id squares castling)
      (contains? (set '(\Q \q \R \r \B \b "Q" "q" "R" "r" "B" "b")) square) (getSlidingMoves id squares)
      (contains? (set '(\N \n "N" "n")) square) (getKnightMoves id squares)
      (contains? (set '(\P \p "P" "p")) square) (getPawnMoves id squares enPassant)
      :else nil)))
(defn get-all-legal-moves [squares activeSide castling enPassant]
  (loop [id 0
         answers '[]]
    (if (= id 64) answers
      (if (= activeSide "w")
          (if (contains? (set '(\K \Q \R \B \N \P "K" "Q" "R" "B" "N" "P")) (get squares id))
              (recur (inc id) (conj answers (get-legal-moves id squares castling enPassant)))
              (recur (inc id) (conj answers '[])))
          (if (contains? (set '(\k \q \r \b \n \p "k" "q" "r" "b" "n" "p")) (get squares id))
              (recur (inc id) (conj answers (get-legal-moves id squares castling enPassant)))
              (recur (inc id) (conj answers '[])))))))

(defn get-params [req]
  (let [params ((assoc-query-params req (or (req :character-encoding) "UTF-8")) :params)
        FEN (params "FEN")
        squares (FENtoSquares FEN)
        activeSide (get (s/split FEN #" ") 1)
        castling (set (s/split (get (s/split FEN #" ") 2) #""))
        enPassant (get (s/split FEN #" ") 3)
        halfMove (get (s/split FEN #" ") 4)
        fullMove (get (s/split FEN #" ") 5)]
  [FEN squares activeSide castling enPassant halfMove fullMove]
  )
)
(defn simple-page [req]
  (println req)
  {:status 200
   :headers {"Content-Type" "text/html",
             "Access-Control-Allow-Origin" "*",
             "Access-Control-Allow-Method" "GET",
               "Access-Control-Allow-Headers" "Origin, X-Requested-With, Content-Type, Accept"}
   :body "Hello"})

(defn legal-moves-request [req]
  (let [[FEN squares activeSide castling enPassant halfMove fullMove] (get-params req)]
    {:status  200
     :headers {"Content-Type" "application/json",
               "Access-Control-Allow-Origin" "*",
               "Access-Control-Allow-Headers" "Origin, X-Requested-With, Content-Type, Accept"}
     :body    (json/write-str {:moves (get-all-legal-moves squares activeSide castling enPassant)})}))
(defn get-moves [req]
  (let [[FEN squares activeSide castling enPassant halfMove fullMove] (get-params req)]
    {:status  200
     :headers {"Content-Type" "application/json"}
     :body    (json/write-str {:moves (str (get-all-legal-moves squares activeSide castling enPassant))})}))



(defroutes app-routes
    (GET "/legal-moves" [] simple-page);legal-moves-request)
    (route/not-found "Error, page not found!")
)

(defn -main
  [& args]
  (let [port (Integer/parseInt (or (System/getenv "PORT") "3001"))]
   (run-jetty legal-moves-request {:port port
                             :join? false})
    (println (str "Running webserver at http://127.0.0.1:" port "/"))))
