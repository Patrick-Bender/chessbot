(defproject rest-api "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.8.0"]
                 ;compojure - A basic routing library
                 [compojure "1.6.2"]
                 ;HTTP library for client/server
                 [http-kit "2.3.0"]
                 ;Ring defaults - for query params etc
                 [ring/ring-core "1.9.2"]
                 [ring/ring-jetty-adapter "1.9.2"]
                 ;necessary for ring
                 [javax.servlet/servlet-api "2.5"]
                 ;clojure data.json library
                 [org.clojure/data.json "2.0.2"]]
  :main ^:skip-aot rest-api.core
  :target-path "target/%s"
  :profiles {:uberjar {:aot :all}})
