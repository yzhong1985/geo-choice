/**
 * Created by Andy on 10/9/2017.
 */
$("document").ready(function(){

    $('#rolesel').change(selectionChange);

});

function selectionChange(e){
    var r = e.target.selectedOptions[0];
    var selvalue = r.value;

    if(selvalue ==1){
        $("#surveyAlink").attr("href", v1_survey_url_a);
        $("#surveyBlink").attr("href", v1_survey_url_b);
    }
    else if(selvalue ==2){
        $("#surveyAlink").attr("href", v2_survey_url_a);
        $("#surveyBlink").attr("href", v2_survey_url_b);
    }
    else if(selvalue ==3){
        $("#surveyAlink").attr("href", v3_survey_url_a);
        $("#surveyBlink").attr("href", v3_survey_url_b);
    }
    else if(selvalue ==4){
        $("#surveyAlink").attr("href", v4_survey_url_a);
        $("#surveyBlink").attr("href", v4_survey_url_b);
    }
    else if(selvalue ==5){
        $("#surveyAlink").attr("href", v5_survey_url_a);
        $("#surveyBlink").attr("href", v5_survey_url_b);
    }
    else if(selvalue ==6){
        $("#surveyAlink").attr("href", v6_survey_url_a);
        $("#surveyBlink").attr("href", v6_survey_url_b);
    }
    else if(selvalue ==7){
        $("#surveyAlink").attr("href", v7_survey_url_a);
        $("#surveyBlink").attr("href", v7_survey_url_b);
    }
    else if(selvalue ==0){
        $("#surveyAlink").attr("href", "javascript:;");
        $("#surveyBlink").attr("href", "javascript:;");
    }

}

//Strategic Planners
var v1_survey_url_a = "https://cgu.co1.qualtrics.com/jfe/form/SV_bOA8IGYCMMXdN2d";
var v1_survey_url_b = "https://cgu.co1.qualtrics.com/jfe/form/SV_738ycgD6AapTDdX";
//Business People
var v2_survey_url_a = "https://cgu.co1.qualtrics.com/jfe/form/SV_9ykWBEOVAlkDNkh";
var v2_survey_url_b = "https://cgu.co1.qualtrics.com/jfe/form/SV_b2UoObtqnFdVmHH";
//CGU EDUCATION
var v3_survey_url_a = "https://cgu.co1.qualtrics.com/jfe/form/SV_1XHZBtjnZ41qWBT";
var v3_survey_url_b = "https://cgu.co1.qualtrics.com/jfe/form/SV_0lEyYHSe7sAFWeh";
//CGU STAFF
var v4_survey_url_a = "https://cgu.co1.qualtrics.com/jfe/form/SV_23NmM9pkCJ7bdPf";
var v4_survey_url_b = "https://cgu.co1.qualtrics.com/jfe/form/SV_0UnNjbtvrRFWPCR";
//CISAT & Business Faculty
var v5_survey_url_a = "https://cgu.co1.qualtrics.com/jfe/form/SV_8uiaS3uOrcgZgJn";
var v5_survey_url_b = "https://cgu.co1.qualtrics.com/jfe/form/SV_0qhwJP8GKmV2753";
//ESRI Staff
var v6_survey_url_a = "https://cgu.co1.qualtrics.com/jfe/form/SV_eR2o2WwMre3bfHn";
var v6_survey_url_b = "https://cgu.co1.qualtrics.com/jfe/form/SV_00rRvXJFvr7KytD";
//CGU Students
var v7_survey_url_a = "https://cgu.co1.qualtrics.com/jfe/form/SV_7OtE3U4qChMzK6x";
var v7_survey_url_b = "https://cgu.co1.qualtrics.com/jfe/form/SV_1TcqUoHUCWtLTlb";
