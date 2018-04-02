package main

import (
    "sync"
    "bufio"
    "os"
    "bytes"
    "net/http"
    "encoding/json"
   // "io/ioutil"
   // "io"
    "flag"

    "github.com/sirupsen/logrus"

    "github.com/tarm/serial"
    "github.com/gin-gonic/gin"
  //  "github.com/prometheus/client_golang/prometheus/promhttp"

)

type Settings struct {
    debug *bool
}

func main() {

    settings := &Settings{}
    // Program options
    settings.debug = flag.Bool("debug", false, "specify flag for debug verbosity")

    flag.Parse()

    // Logging
    logrus.SetOutput(os.Stderr)
    if *settings.debug {
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
        log := logrus.WithFields(logrus.Fields{"module": "main", "function": "mainPrometheus"})
        log.Info("Starting")
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
            parser := json.NewDecoder(resp.Body)
            err := parser.Decode(&t)
            if err != nil {
                log.Error(err)
            }

            if t.Cmd != "" {
                log.Info("Task received: ", t)
            }
        }
    }

    if err := scanner.Err(); err != nil {
        log.Warn("reading standard input:", err)
    }
}
