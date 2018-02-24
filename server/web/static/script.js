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


function button(data) {
    $('textarea#debug').html(data);
}


function init() {
    refreshLog();
    
    $(":button").click(function() {
        $.get("/node/"+$(this).data('node')+"/"+$(this).data('fce'), {}, button)
    });
}

$(document).ready(init);
