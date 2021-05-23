$(document).ready(() => {
    $('button#btn_mon').on('click', (event) => {
        $('button#btn_mon').prop("disabled", true);
        $('button#btn_viz').prop("disabled", true);
        promptContentDiv("Chargement des données de AWS vers mongo... Cela peut prendre plusieurs minutes.");
        $.get("/mongo")
            .done((data) => {
                $('button#btn_mon').prop("disabled", false);
                $('button#btn_viz').prop("disabled", false);
                if (typeof err.responseText == "undefined")
                    err.responseText = "Une erreur s'est produite : impossible de contacter le serveur."
                promptContentDiv(data);
            }).fail((err) => {
                $('button#btn_mon').prop("disabled", false);
                $('button#btn_viz').prop("disabled", false);
                if (typeof err.responseText == "undefined")
                    err.responseText = "Une erreur s'est produite : impossible de contacter le serveur."
                promptContentDiv(err.responseText, true);
            });
    });
});

function promptContentDiv(message, isError = false) {
    let contentDiv = $('#content');
    contentDiv.empty();
    contentDiv.show();
    contentDiv.append("<span" + (isError ? " style='color:red;'" : "") + ">" + message + "</span>");
}