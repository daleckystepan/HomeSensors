function refreshLog() {
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
                $("#tasks").append(item)
            }
        }

        setTimeout(refreshTasks, 300, template);
    });
    return false;
}


function button(data) {
    $('textarea#debug').html(data);
}


function init() {
    var source   = $("#task-template").html();
    var template = Handlebars.compile(source);

    refreshLog();
    refreshTasks(template);

    $(":button").click(function() {
        $.get("/node/"+$(this).data('node'), {'cmd': $(this).data('cmd')}, button)
    });
}

$(document).ready(init);
