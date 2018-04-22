package main

import (
    "sync"
    "regexp"
    "net/http"
    "container/ring"
    "container/list"
    "time"
    "strconv"

    "github.com/sirupsen/logrus"
    "github.com/fatih/structs"
    "github.com/gin-gonic/gin"
    "github.com/gin-contrib/cors"
    "github.com/HouzuoGuo/tiedot/db"
)

var serialParser = regexp.MustCompile(`#\ ID:\ (?P<id>\d+)\ RSSI:\ (?P<rssi>-?\d+)\ RT:\ (?P<radiotemp>\d+)\ T:\ (?P<temp>\d+\.\d+)\ H:\ (?P<humidity>\d+\.\d+)\ L:\ (?P<light>\d+)`)

var serialBuffer struct {
    ring *ring.Ring
    mutex sync.Mutex
}

var taskBuffer struct {
    list *list.List
    mutex sync.Mutex
}

type Env struct {
    db *db.DB
    log *logrus.Entry
    task int
    taskMutex sync.Mutex
}

const (
    TASK_CREATED            = "created"
    TASK_PROCESSING         = "processing"
    TASK_COMPLETED_OK       = "ok"
    TASK_COMPLETED_ERROR    = "error"
)

type Task struct {
    Id int              `structs:"id",      json:"id"`
    Node int            `structs:"node",    json:"node"`
    Cmd string          `structs:"cmd",     json:"cmd"`
    Params []string     `structs:"params",  json:"params,omitempty"`
    State string        `structs:"state",   json:"state,omitempty"`
}

type Node struct {
    Id int64            `structs:"id"`
    Rssi int64          `structs:"rssi"`
    Radiotemp int64     `structs:"radiotemp"`
    Temp float64        `structs:"temp"`
    Humidity float64    `structs:"humidity"`
    Light int64         `structs:"light"`
    Datetime string     `structs:"datetime"`
}

func parseLine(exp *regexp.Regexp, line string) (result map[string]interface{}) {

    match := serialParser.FindStringSubmatch(line)

    if match != nil {
        result = make(map[string]interface{})

        for i, name := range exp.SubexpNames() {
            if i != 0 && name != "" {
                result[name] = match[i]
            }
        }

    }

    return result
}


func nodeFromJson(node map[string]interface{}) (*Node) {
    id, _ := strconv.ParseInt(node["id"].(string), 10, 0)
    rssi, _ := strconv.ParseInt(node["rssi"].(string), 10, 0)
    rt, _ := strconv.ParseInt(node["radiotemp"].(string), 10, 0)
    temp, _ := strconv.ParseFloat(node["temp"].(string), 64)
    hum, _ := strconv.ParseFloat(node["humidity"].(string), 64)
    light, _ := strconv.ParseInt(node["light"].(string), 10, 0)

    return  &Node{  Id: id,
                    Rssi: rssi,
                    Radiotemp: rt,
                    Temp: temp,
                    Humidity: hum,
                    Light: light,
                    Datetime: node["datetime"].(string)}
}

func mainGin(wg *sync.WaitGroup) {
    defer wg.Done()

    mlog := logrus.WithFields(logrus.Fields{"module": "main", "function": "mainSerial"})
    log := mlog.WithFields(logrus.Fields{"function": "mainSerial"})
    log.Info("Starting")

    serialBuffer.ring = ring.New(25)

    taskBuffer.list = list.New()

    var myDB = initDB()
    defer myDB.Close()
    env := &Env{db: myDB, log: mlog}


    router := gin.Default()

    // Has to be before any Group or endpoint definition
    config := cors.DefaultConfig()
    config.AllowOrigins = []string{"http://localhost:4200", "http://192.168.1.24:4200"}
    router.Use(cors.New(config))


    router.StaticFS("/static", http.Dir("static"))

    v1 := router.Group("/v1")
    {
        v1.GET("/serial", env.serialGet)
        v1.POST("/serial", env.serialPost)

        v1.GET("/nodes", env.nodesGet)
        v1.GET("/node/:id", env.nodeGet)

        v1.GET("/tasks", env.tasksGet)
        v1.POST("tasks", env.tasksPost)
        v1.GET("/task/:id", env.taskGet)
    }

    router.Run()
}


func (e *Env) serialPost(c *gin.Context) {
    log := e.log.WithFields(logrus.Fields{"function": "serialPost"})

    var line string

    if err := c.BindJSON(&line); err == nil {
        serialBuffer.mutex.Lock()
        serialBuffer.ring.Value = line
        serialBuffer.ring = serialBuffer.ring.Next()
        serialBuffer.mutex.Unlock()

        match := parseLine(serialParser, line)

        if match != nil {
            nodes := e.db.Use(DB_NODES_COLLECTION)
            t := time.Now()
            match["datetime"] = t.Format("2. 1. 2006 15:04:05")
            node := nodeFromJson(match)
            upsertNode(nodes, structs.Map(node), "id")
            //PrintCol(nodes)
        }


        if taskBuffer.list.Len() != 0 {

            taskBuffer.mutex.Lock()
            elem := taskBuffer.list.Front()
            id := elem.Value
            taskBuffer.list.Remove(elem)
            taskBuffer.mutex.Unlock()

            tasks := e.db.Use(DB_TASKS_COLLECTION)

            log.Debug("Task ID: ", id)

            query := map[string]interface{}{
                "eq":    id,
                "in":    []interface{}{"id"},
            }
/*
            queryNode := map[string]interface{}{
                "eq":    nodeId,
                "in":    []interface{}{"node"},
            }

            query := map[string]interface{}{
                "n":     []interface{}{queryId, queryNode},
            }
*/
            queryResult := make(map[int]struct{})
            db.EvalQuery(query, tasks, &queryResult)

            for id := range queryResult {
                task, err := tasks.Read(id)
                if err == nil {
                    log.Debug("Task returned:", task)
                    c.JSON(http.StatusOK, task)
                    tasks.Delete(id)
                    return
                }
            }

        }
        c.JSON(http.StatusOK, nil)
        return
    }
    c.JSON(http.StatusBadRequest, nil)
}


func (e *Env) serialGet(c *gin.Context) {
    var l []string

    serialBuffer.mutex.Lock()

    serialBuffer.ring.Do(func(p interface{}) {
        if p != nil {
            l = append(l, p.(string))
        }
    })

    serialBuffer.mutex.Unlock()

    c.JSON(http.StatusOK, l)
}

func (e *Env) nodesGet(c *gin.Context) {
    nodes := e.db.Use(DB_NODES_COLLECTION)
    list := ListCol(nodes)

    c.JSON(http.StatusOK, list)
}

func (e *Env) nodeGet(c *gin.Context) {
    id := c.Param("id")

    nodes := e.db.Use(DB_NODES_COLLECTION)

    query := map[string]interface{}{
        "eq":    id,
        "in":    []interface{}{"id"},
    }

    queryResult := make(map[int]struct{})
    db.EvalQuery(query, nodes, &queryResult)

    for id := range queryResult {
        node, err := nodes.Read(id)
        if err == nil {
            c.JSON(http.StatusOK, node)
            return
        }
    }

    c.JSON(http.StatusNotFound, nil)
}


func (e *Env) tasksGet(c *gin.Context) {
    tasks := e.db.Use(DB_TASKS_COLLECTION)
    list := ListCol(tasks)

    c.JSON(http.StatusOK, list)
}


func (e *Env) tasksPost(c *gin.Context) {
    log := e.log.WithFields(logrus.Fields{"function": "tasksPost"})

    var task Task
    if err := c.BindJSON(&task); err == nil {

        e.taskMutex.Lock()
        task.Id = e.task
        e.task++
        e.taskMutex.Unlock()

        task.State = TASK_CREATED

        log.Debug("Task created: ", task)

        taskBuffer.mutex.Lock()
        taskBuffer.list.PushBack(task.Id)
        //fmt.Println(taskBuffer.list)
        taskBuffer.mutex.Unlock()

        tasks := e.db.Use(DB_TASKS_COLLECTION)
        tasks.Insert(structs.Map(task))


        c.JSON(http.StatusOK, task)
    } else {
        log.Error(err)
    }
}


func (e *Env) taskGet(c *gin.Context) {
    id := c.Param("id")

    nodes := e.db.Use(DB_TASKS_COLLECTION)

    query := map[string]interface{}{
        "eq":    id,
        "in":    []interface{}{"id"},
    }

    queryResult := make(map[int]struct{})
    db.EvalQuery(query, nodes, &queryResult)

    for id := range queryResult {
        node, err := nodes.Read(id)
        if err == nil {
            c.JSON(http.StatusOK, node)
            return
        }
    }

    c.JSON(http.StatusNotFound, nil)
}
