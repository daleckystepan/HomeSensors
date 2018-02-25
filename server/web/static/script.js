function refreshLog() {
//    console.log("RefreshLog")
    $.get("/serial", {param: $(this).attr('id')},
    function(data) {
        json = jQuery.parseJSON(data)
        lines = []
        for (var i = 0; i < json.length; i++)
        {
            lines += json[i] + "\n"
        }
        $('textarea#log').html(lines);
        $('textarea#log').scrollTop($('textarea#log')[0].scrollHeight);

        setTimeout(refreshLog, 300);
    });
    return false;
};


function refreshTasks(template) {
//    console.log("RefreshTasks")
    $.get("/tasks", {},
    function(data) {
        json = jQuery.parseJSON(data)

        for(var i = 0; i < json.length; i++)
        {
            task = $("#"+json[i]['uuid'])
            if(task.length)
            {
                //update()
            }
            else
            {
                item = template(json[i])
                parent = $("#tasks").append(item)
                refreshTask(parent.find('#'+json[i]['uuid']))
            }
        }

        setTimeout(refreshTasks, 300, template);
    });
    return false;
}


function refreshTask(task) {
    uuid = task.data('uuid')
//    console.log("RefreshTask: " + uuid)

    $.get('/task/'+uuid, {},
    function(data) {
        json = jQuery.parseJSON(data)

        if(!jQuery.isEmptyObject(json))
        {
            $.each(json, function(index, value) {
                console.log(value)
            });

            setTimeout(refreshTask, 1000, task)
        }
        else
        {
            task.detach();
        }
    });
}


function refreshNode(node) {
    id = node.data('node')
//    console.log("RefreshNode: " + id)
    $.get('/node/'+id, {},
    function(data) {
        json = jQuery.parseJSON(data)
        //console.log(json)

        $.each(['rssi', 'radiotemp', 'temp', 'humidity', 'light', 'datetime'], function(index, value) {
            node.find('.node-'+value).html(json[value])
        });

        setTimeout(refreshNode, 2000, node)
    });
}


function button(data) {
    $('textarea#debug').html(data);
}


function init() {
    var source   = $("#task-template").html();
    var template = Handlebars.compile(source);

    refreshLog();
    refreshTasks(template);

    $(".node").each(function(i, obj) {
        refreshNode($(this))
    });

    $(":button").click(function() {
        $.get("/node/"+$(this).data('node'), {'cmd': $(this).data('cmd')}, button)
    });
}

$(document).ready(init);
