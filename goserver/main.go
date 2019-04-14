package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"net/http"
	"os"
	"sync"

	// "io/ioutil"
	// "io"
	"flag"

	"github.com/sirupsen/logrus"

	"github.com/gin-gonic/gin"
	"github.com/tarm/serial"
)

type settings struct {
	debug  *bool
	serial *string
	listen *string
}

func main() {
	settings := &settings{}
	// Program options
	settings.debug = flag.Bool("debug", false, "specify flag for debug verbosity")
	settings.serial = flag.String("serial", "/dev/ttyUSB0", "Specify serial path")
	settings.listen = flag.String("listen", ":8000", "API Listen port")

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

	go mainSerial(&wg, settings)

	go mainGin(&wg, settings)

	go func() {
		defer wg.Done()
		log := logrus.WithFields(logrus.Fields{"module": "main", "function": "mainPrometheus"})
		log.Info("Starting")
	}()

	log.Info("Waiting for Go Routines")
	wg.Wait()
}

func mainSerial(wg *sync.WaitGroup, settings *settings) {
	defer wg.Done()
	log := logrus.WithFields(logrus.Fields{"module": "main", "function": "mainSerial"})
	log.Info("Starting")

	c := &serial.Config{Name: *settings.serial, Baud: 9600}
	s, err := serial.OpenPort(c)
	if err != nil {
		log.Fatal(err)
	}

	scanner := bufio.NewScanner(s)

	for scanner.Scan() {
		var line = scanner.Text()
		linejson, _ := json.Marshal(line)

		log.Debug(line)

		resp, err := http.Post("http://localhost:8000/v1/serial", "application/json", bytes.NewReader(linejson))

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
