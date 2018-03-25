package main

import (
    "sync"
    "bufio"
    "os"
    "bytes"
    "net/http"
    "encoding/json"
    "io/ioutil"
    "io"

    "flag"

    "github.com/sirupsen/logrus"

    "github.com/tarm/serial"
    "github.com/gin-gonic/gin"
  //  "github.com/prometheus/client_golang/prometheus/promhttp"

)


func main() {

    debugPtr := flag.Bool("debug", false, "specify flag for debug verbosity")

    flag.Parse()

    logrus.SetOutput(os.Stderr)
    if *debugPtr {
        logrus.SetLevel(logrus.DebugLevel)
    } else {
        logrus.SetLevel(logrus.InfoLevel)
        gin.SetMode(gin.ReleaseMode)
    }


    log := logrus.WithFields(logrus.Fields{"module": "main", "function": "main"})
    log.Info("Starting Go Routines")

    var wg sync.WaitGroup
    wg.Add(3)

    go mainSerial(&wg)

    go mainGin(&wg)

    go func(){
        defer wg.Done()
        logrus.WithFields(logrus.Fields{"module": "main", "function": "mainPrometheus"}).Info("Starting")
    }()

    log.Info("Waiting for Go Routines")
    wg.Wait()
}

func mainSerial(wg *sync.WaitGroup) {
    defer wg.Done()
    log := logrus.WithFields(logrus.Fields{"module": "main", "function": "mainSerial"})
    log.Info("Starting")

    c := &serial.Config{Name: "/dev/ttyUSB0", Baud: 9600}
    s, err := serial.OpenPort(c)
    if err != nil {
            log.Fatal(err)
    }

    scanner := bufio.NewScanner(s)

    for scanner.Scan() {
        var line = scanner.Text()
        linejson,_ := json.Marshal(line)

        resp,err := http.Post("http://localhost:8080/v1/serial", "application/json", bytes.NewReader(linejson))

        if err != nil {
            log.Error(err)
        } else {
            defer resp.Body.Close()
            var t Task
            body, err := ioutil.ReadAll(resp.Body)
            if err == nil {
                log.Debug("Body-text: ", string(body))
                err := json.Unmarshal(body, &t)
                if err == nil {
                    log.Debug("Body: ", t)
                } else {
                    log.Error("Unamrshall error: ", err)
                }
            } else if err == io.EOF {
                log.Error("Error ReadAll eof: ", err)
            } else {
                log.Error("Error ReadAll: ", err)
            }
        }
    }

    if err := scanner.Err(); err != nil {
        log.Warn("reading standard input:", err)
    }
}
