function refreshLog() {
$.get("/serial/", {param: $(this).attr('id')}, 
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


function refreshTasks() {
    $.get("/tasks/", {},
    function(data) {
        json = jQuery.parseJSON(data)
        
        for(var i = 0; i < json.length; i++)
        {
            task = $("div#"+json[i]['uuid']).this

            if(task)
            {
                task.append("Ahoj")
                //update()
            }
            else
            {
                item = '<div id="' + json[i]['uuid'] + '">'
                item += '<i class="far fa-square"></i> '
                item += '<b>'+ json[i].cmd + '</b> <span>' + json[i].node + '</span>'
                item += '</div>'
                $("#tasks").append(item)
            }
        }
        
        setTimeout(refreshTasks, 300);
    });
    return false;
}


function button(data) {
    $('textarea#debug').html(data);
}


function init() {
    refreshLog();
    refreshTasks();
    
    $(":button").click(function() {
        $.get("/node/"+$(this).data('node')+"/"+$(this).data('cmd'), {}, button)
    });
}

$(document).ready(init);
