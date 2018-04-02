package main

import (
    "reflect"
    "encoding/json"

    "github.com/sirupsen/logrus"
    "github.com/HouzuoGuo/tiedot/db"
)

// // Embedding
// type MyDatabase struct {
//     *db.DB
// }
//
// func initDB() *MyDatabase {
//     myDB, err := db.OpenDB("db")
//     if err != nil {
//         panic(err)
//     }
//
//     // Embedd one
//     return &MyDatabase{myDB}
// }
//
// func (db *MyDatabase) Use(name string) *db.Col {
//     return nil
// }

const (
    DB_NAME = "db"
    DB_NODES_COLLECTION = "Nodes"
    DB_TASKS_COLLECTION = "Tasks"
)


func upsertNode(col *db.Col, doc map[string]interface{}, key string) (id int, err error) {
    log := logrus.WithFields(logrus.Fields{"module": "db", "function": "upsertNode"})

    query := map[string]interface{}{
        "eq":    doc[key],
        "in":    []interface{}{key},
    }

    queryResult := make(map[int]struct{})
    if err := db.EvalQuery(query, col, &queryResult); nil != err {
        panic(err)
    }

    for id := range queryResult {
        log.Debug("Updating ", id)
        col.Update(id, doc)
    }

    if len(queryResult) == 0 {
        log.Debug("Creating new one ")
        id,err = col.Insert(doc)
    }

    return
}


func ForceIndex(col *db.Col, idxPath []string) (err error) {
    log := logrus.WithFields(logrus.Fields{"module": "db", "function": "ForceIndex"})

    var found = false

    for _, path := range col.AllIndexes() {
        if reflect.DeepEqual(path, idxPath) {
            log.Debug("I already have an index on path %v\n", path)
            found = true
            break
        }
    }

    if !found {
        err = col.Index(idxPath)
        if nil != err {
            panic(err)
        }
    }

    return err
}


func PrintCol(col *db.Col) {
    log := logrus.WithFields(logrus.Fields{"module": "db", "function": "PrintCol"})

    col.ForEachDoc(func(id int, docContent []byte) (willMoveOn bool) {
        log.Debug("Document ", id, " is ", string(docContent))
        return true  // move on to the next document
    })

}


func ListCol(col *db.Col) (result []map[string]interface{}) {

    col.ForEachDoc(func(id int, docContent []byte) (willMoveOn bool) {
        var docObj map[string]interface{}
        if err := json.Unmarshal(docContent, &docObj); err == nil {
            result = append(result, docObj)
        }
        return true  // move on to the next document
    })

    return result
}


func initDB() (myDB *db.DB) {

    myDB, err := db.OpenDB(DB_NAME)
    if err != nil {
        panic(err)
    }

    myDB.Drop(DB_NODES_COLLECTION)
    myDB.Drop(DB_TASKS_COLLECTION)

    nodes := myDB.ForceUse(DB_NODES_COLLECTION)
    ForceIndex(nodes, []string{"id"})

    tasks := myDB.ForceUse(DB_TASKS_COLLECTION)
    ForceIndex(tasks, []string{"id"})

    return myDB
}
