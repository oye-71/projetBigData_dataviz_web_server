if (d3 == null) {
    throw new Error("D3.js does not exist");
}

var maxIdCV = 0;

$(document).ready(() => {
    // Main buttons
    $('button#btn_cv').on('click', (event) => {
        displayCVSearch();
    });
    $('button#btn_job').on('click', (event) => {
        $('button').each(() => $(this).prop("disabled", true));
        promptContentDiv("Waiting for the server querying mongo...");
        $.get("/viz/metiers_list")
            .done((data) => {
                $('button').each(() => $(this).prop("disabled", false));
                promptContentDiv(data);
            }).fail((err) => {
                $('button').each(() => $(this).prop("disabled", false));
                promptContentDiv(err.responseText, true);
            });
    });

    // Id_CV buttons
    $('button#button_id_cv').on('click', (event) => {
        if (parseInt($('#input_id_cv').val()) > maxIdCV) {
            promptContentDiv("Aucun CV possédant cet id n'existe en base.", true);
        } else {
            $.get("/viz/id_cv/" + $('#input_id_cv').val())
                .done((data) => {
                    $('button').each(() => $(this).prop("disabled", false));
                    displayCVStats(data);
                }).fail((err) => {
                    $('button').each(() => $(this).prop("disabled", false));
                    promptContentDiv(err.responseText, true);
                });
        }
    })
});

function promptContentDiv(message, isError = false) {
    let contentDiv = $('#content');
    contentDiv.empty();
    contentDiv.append("<p" + (isError ? " style='color:red;'" : "") + ">" + message + "</p>");
}

function displayCVSearch() {
    let contentDiv = $('#content');
    contentDiv.empty();
    let contentJobsDiv = $('#content_jobs');
    contentJobsDiv.attr("hidden", true);
    let contentCVDiv = $('#content_cv');
    contentCVDiv.attr("hidden", false);
    $.get("/viz/id_cv")
        .done((data) => {
            maxIdCV = parseInt(data);
            $("#input_label_id_cv").text("Id du CV recherché (entre 0 et " + maxIdCV + ")");
        }).fail((err) => {
            promptContentDiv(err.responseText, true);
        });

    $("#input_id_cv").on("input", (event) => {
        let ct = $(event.currentTarget);
        ct.val(ct.val().replace(/[^0-9]/g, ''));
    });
}

// TODO Etienne
// Deux fichiers supplémentaires : viz_cv.js et viz_jobs.js
// Les méthodes de ces fichiers doivent être appelées dans les callbacks ajax de celui-ci