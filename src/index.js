$(document).ready(() => {
    $('button#btn_mon').on('click', (event) => {
        $('button#btn_mon').prop("disabled", true);
        $('button#btn_viz').prop("disabled", true);
        promptContentDiv("Waiting for the server... This could take several minutes.");
        $.get("/mongo")
            .done((data) => {
                $('button#btn_mon').prop("disabled", false);
                $('button#btn_viz').prop("disabled", false);
                promptContentDiv(data);
            }).fail((err) => {
                $('button#btn_mon').prop("disabled", false);
                $('button#btn_viz').prop("disabled", false);
                promptContentDiv(err.responseText, true);
            });
    });
});

function promptContentDiv(message, isError = false) {
    let contentDiv = $('#content');
    contentDiv.empty();
    contentDiv.append("<p" + (isError ? " style='color:red;'" : "") + ">" + message + "</p>");
}