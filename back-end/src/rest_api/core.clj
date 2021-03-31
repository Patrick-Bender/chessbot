(ns rest-api.core
  (:require [org.httpkit.server :as server]
            [compojure.core :refer :all]
            [compojure.route :as route]
            [ring.core.protocols :refer :all]
            [ring.adapter.jetty :refer :all]
            [ring.middleware.params :refer :all]
            [clojure.string :as str]
            [clojure.pprint :as pp]
            [clojure.data.json :as json])
  (:gen-class))
(defn checkLegality [id squares]
  )
(defn truthy? [s]
  (cond
    (contains? (set '("false" "False" "f" "F")) s) false
    (contains? (set '("true" "True" "t" "T")) s) true
    :default (throw (Exception. (str "Truthy? could not evaluate the string: " s)))))
(comment
(defn oldFENtoSquares [FEN & {:keys [squares] :or {squares '[]}}]
  (clojure.pprint/pprint squares)
  (cond 
    ;stop when get to a space
    (= \space (get FEN 0)) squares
    ;skip slashes
    (= "/" (get FEN 0)) (conj squares (FENtoSquares (subs FEN 1 (count FEN)) :squares squares))
    ;if first character is a number
    (not= nil (re-find #"[0-9]" (str (get FEN 0)))) (conj squares (repeat (- (int (get FEN 0)) 48) "") (FENtoSquares (subs FEN 1 (count FEN)) :squares squares))
    :default (conj squares (get FEN 0) (FENtoSquares (subs FEN 1 (count FEN)) :squares squares))
    )
  )
)
(defn FENtoSquares [FEN & {:keys [squares] :or {squares '[]}}]
  (loop [FEN FEN
         squares squares]
    (cond
      (= \space (get FEN 0)) squares
      (= \/ (get FEN 0)) (recur (subs FEN 1 (count FEN)) squares)
      (not= nil (re-find #"[0-9]" (str (get FEN 0)))) (recur (subs FEN 1 (count FEN)) (vec (concat squares (repeat (- (int (get FEN 0)) 48) ""))))
      :default (recur (subs FEN 1 (count FEN)) (conj squares (get FEN 0)))
      )
    )
  )
(defn simple-body-page [req]
  {:status  200
   :headers {"Content-Type" "text/html"}
   :body    "Hello World"})

(defn move-request [req]
  (println "request: " req)
  (println "HEADERS: " (req :headers))
  (let [params ((assoc-query-params req (or (req :character-encoding) "UTF-8")) :params)
        FEN (params "FEN")
        squares (FENtoSquares FEN)
        ]
    (println "Squares: " squares)
    (println (count squares))
    {:status  200
     :headers {"Content-Type" "application/json"}
     :body    (json/write-str {:hello "Hello"})}))


(defroutes app-routes
    (GET "/move-request" [] move-request)
    (route/not-found "Error, page not found!")
)

(defn -main
  [& args]
  (let [port (Integer/parseInt (or (System/getenv "PORT") "3001"))]
   (run-jetty move-request {:port port
                             :join? false})
    (println (str "Running webserver at http://127.0.0.1:" port "/"))))
