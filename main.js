class ElementDataAccess {
    getInteger(id) { 
        let element = document.getElementById(id);
        if (element.innerText) {
            return parseInt(element.innerText);
        } else if (element.value) {
            return parseInt(element.value);
        }
        return 0;
    }
    setInteger(id, value) {
        let element = document.getElementById(id);
        if (element.innerText) {
            element.innerText = value;
            return true;
        } else if (element.value) {
            element.value = value;
            return true;
        }
        return false;
    }
    getTime(id) { 
        let element = document.getElementById(id), time;
        if (element.innerText) {
            time = element.innerText;
        } else if (element.value) {
            time = element.value;
        }
        if (time.indexOf(':')) {
            let ts = time.split(':');
            return {'hour' : parseInt(ts[0]), 'minute' : parseInt(ts[1]) };
        }
        return {'hour': 0, 'minute': 0 };
    }
    setTime(id, value) {
        if (value.hasOwnProperty('hour') && value.hasOwnProperty('minute'))
        {
            value.hour = Math.floor(value.hour).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false});
            value.minute = Math.floor(value.minute).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false});
            let element = document.getElementById(id), time;
            time = Object.values(value).join(':');
            if (element.innerText) {
                element.innerText = time;
                return true;
            } else if (element.value) {
                element.value = time;
                return true;
            }
        }
        return false;
    }
    isChecked(id) {
        let element = document.getElementById(id);
        if (element.checked === true) {
            return true;
        }
        return false;
    }

}
class StockMetrics extends ElementDataAccess {
    data = {};
    constructor() {
        super();
        let ls = JSON.parse(window.localStorage.getItem('appSession'));
        if (ls == null) {
            ls = {
                "metricTotalCases": 0, 
                "metricTaskedAssociates": 0, 
                "metricTaskStart": 0,
                "metricTaskEnd": 0, 
                "metricTaskLunch": true, 
                "metricCphTarget": 45, 
                "metricCards": []
            };
        }
        this.data = ls;
    }
    dataSave() {
        window.localStorage.setItem('appSession', JSON.stringify(this.data));
    }
    getElapsedMinutes(taskStart, taskEnd) {
        let dateTime = new Date();
        let dateTimeStart = new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate(), parseInt(taskStart.hour), parseInt(taskStart.minute), parseInt(0));
        let dateTimeEnd = new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate(),parseInt(taskEnd.hour), parseInt(taskEnd.minute), parseInt(0));
        return ((dateTimeEnd - dateTimeStart) / 1000) / 60;
    }
    lunchElapsedMinutes(elapsedMinutes, lunchState) {
        let allotedMinutes = 60;
        if (lunchState === false) {
            return elapsedMinutes; 
        }
        if (elapsedMinutes > allotedMinutes) {
            elapsedMinutes -= allotedMinutes;// We're going to take away X minutes for lunch, but only if we have more than X minutes tasked.
        }
        return elapsedMinutes;
    }
    updateMetricCard(metricCard) {
        let cphTarget = this.getInteger('metricCphTarget'), 
        taskCases = this.getInteger('metricCases' + metricCard.id),
        taskStart = this.getTime('metricTaskStart' + metricCard.id),
        taskLunch = this.isChecked('metricTaskLunch' + metricCard.id),
        taskEnd = this.getTime('metricTaskEnd' + metricCard.id),
        taskCph = this.getInteger('metricTaskCph' + metricCard.id);
        metricCard.taskCases = taskCases;
        metricCard.taskStart = taskStart;
        metricCard.taskLunch = taskLunch;

        let wisheAllMinutes = (60 / cphTarget) * taskCases; // Divide the target cases by 60 minutes for the time per case, and multiply by the tasked cases for the total minutes tasked.
        if (taskLunch) {
            if (wisheAllMinutes > 60) {
                wisheAllMinutes += 60;// We're going to add X minutes for lunch, but only if we have more than X minutes tasked.
            }
        }
        if (wisheAllMinutes < 0) {
            wisheAllMinutes = 0;
        }
        wisheAllMinutes += taskStart.minute;
        let wisheHour = taskStart.hour + (wisheAllMinutes / 60), 
        wisheMinute = wisheAllMinutes % 60;
        wisheAllMinutes -= taskStart.minute;
        
        this.setTime('metricWishe' + metricCard.id, {'hour' : wisheHour, 'minute' :  wisheMinute});

        if (taskCph == 0) {// We don't want to update the time the task ends yet.
            // The task may go over the alloted time.
            this.setTime('metricTaskEnd' + metricCard.id, {'hour' : wisheHour, 'minute' :  wisheMinute});
        }
        taskEnd = this.getTime('metricTaskEnd' + metricCard.id);
        metricCard.taskEnd = taskEnd;

        let elapsedMinutes = this.getElapsedMinutes(taskStart, taskEnd);
        elapsedMinutes = this.lunchElapsedMinutes(elapsedMinutes, taskLunch);
        wisheAllMinutes = this.lunchElapsedMinutes(wisheAllMinutes, taskLunch);
        let elapsedTimeloss = Math.floor(elapsedMinutes - (wisheAllMinutes));
        if (elapsedTimeloss < 0) {
            elapsedTimeloss = 0;
        }
        this.setInteger('metricTimeloss' + metricCard.id, elapsedTimeloss);

        let caseProjection = Math.ceil(60 / (elapsedMinutes / taskCases));// Total task minutes divided by the number of cases for the minutes per case. Then divided that by how many minutes are in an hour to get the cases per minute.
        this.setInteger('metricTaskCph' + metricCard.id, caseProjection);
        return metricCard;
    }
    addMetricCard(metricCard) {
        let div = document.createElement('div'), 
        metricCards = document.getElementById('metricCards');
        let uiMetricCard = document.createElement('div'), 
            uiHeading = document.createElement('h2'),
            uiHeadingMarkComplete = document.createElement('input'),
            uiHeadingDelete = document.createElement('div'), 
            uiWhitespace = document.createElement('div'),
            uiTable = document.createElement('div'),
            uiTableRow = document.createElement('div'),
            uiTableCol1Cases = document.createElement('div'),
            uiTableCol2Cases = document.createElement('div'),
            uiInputTaskCases = document.createElement('input'),
            uiTableCol1TaskStart = document.createElement('div'),
            uiTableCol2TaskStart = document.createElement('div'),
            uiInputTaskStart = document.createElement('input'),
            uiTableCol1TaskLunch = document.createElement('div'),
            uiTableCol2TaskLunch = document.createElement('div'),
            uiInputTaskLunch = document.createElement('input'),
            uiTableCol1TaskEnd = document.createElement('div'),
            uiTableCol2TaskEnd = document.createElement('div'),
            uiInputTaskEnd = document.createElement('input'),
            uiTableCol1Wishe = document.createElement('div'),
            uiPWishe = document.createElement('p'),
            uiTableCol1Cph = document.createElement('div'),
            uiTableCol2Cph = document.createElement('div'),
            uiSpanCph = document.createElement('span'),
            uiTableCol1Timeloss = document.createElement('div'),
            uiPTimeloss = document.createElement('p');

        uiMetricCard.className = 'ui-metric-card';

        uiWhitespace.className = 'ui-whitespace';
        uiTable.id = 'marked_completed_' + metricCard.id;
        uiTable.className = 'ui-uiTable';
        uiTable.style.opacity = '100%';
        uiTableRow.className = 'ui-table-row';

        uiTableCol1Cases.className = 'ui-table-col-50';
        uiTableCol1Cases.innerText = 'Cases';
        uiTableRow.appendChild(uiTableCol1Cases);
        uiTableCol2Cases.className = 'ui-table-col-50';
        uiInputTaskCases.setAttribute('type', 'number');
        uiInputTaskCases.setAttribute('value', metricCard.taskCases);
        uiInputTaskCases.setAttribute('id', 'metricCases' + metricCard.id);
        uiTableCol2Cases.appendChild(uiInputTaskCases);
        uiTableRow.appendChild(uiTableCol2Cases);

        uiTableCol1TaskStart.className = 'ui-table-col-50';
        uiTableCol1TaskStart.innerText = "Task Start";
        uiTableRow.appendChild(uiTableCol1TaskStart);
        uiTableCol2TaskStart.className = 'ui-table-col-50';
        uiInputTaskStart.setAttribute('type', 'time');
        uiInputTaskStart.setAttribute('min', '00:00');
        uiInputTaskStart.setAttribute('max', '24:00');
        uiInputTaskStart.setAttribute('value', Math.floor(metricCard.taskStart.hour).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false}) + ':' + Math.floor(metricCard.taskStart.minute).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false}));
        uiInputTaskStart.setAttribute('id', 'metricTaskStart' + metricCard.id);
        uiTableCol2TaskStart.appendChild(uiInputTaskStart);
        uiTableRow.appendChild(uiTableCol2TaskStart);

        uiTableCol1TaskLunch.className = 'ui-table-col-50';
        uiTableCol1TaskLunch.innerText = "Lunch";
        uiTableRow.appendChild(uiTableCol1TaskLunch);
        uiTableCol2TaskLunch.className = 'ui-table-col-50';
        uiInputTaskLunch.setAttribute('type', 'checkbox');
        uiInputTaskLunch.setAttribute('value', 1);
        uiInputTaskLunch.checked = metricCard.taskLunch;
        uiInputTaskLunch.setAttribute('id', 'metricTaskLunch' + metricCard.id);
        uiTableCol2TaskLunch.appendChild(uiInputTaskLunch);
        uiTableRow.appendChild(uiTableCol2TaskLunch);

        uiTableCol1TaskEnd.className = 'ui-table-col-50';
        uiTableCol1TaskEnd.innerText = "Task End";
        uiTableRow.appendChild(uiTableCol1TaskEnd);
        uiTableCol2TaskEnd.className = 'ui-table-col-50';
        uiInputTaskEnd.setAttribute('type', 'time');
        uiInputTaskEnd.setAttribute('min', '00:00');
        uiInputTaskEnd.setAttribute('max', '24:00');
        uiInputTaskEnd.setAttribute('value', Math.floor(metricCard.taskEnd.hour).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false}) + ':' + Math.floor(metricCard.taskEnd.minute).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false}));
        uiInputTaskEnd.setAttribute('id', 'metricTaskEnd' + metricCard.id);
        uiTableCol2TaskEnd.appendChild(uiInputTaskEnd);
        uiTableRow.appendChild(uiTableCol2TaskEnd);

        uiTableCol1Wishe.className = 'ui-table-col-100';
        uiPWishe.className = 'ui-attention';
        uiPWishe.innerText = 'When it should have ended: ';
        uiPWishe.innerHTML += '<span id="metricWishe' + metricCard.id + '">00:00</span>';
        uiTableCol1Wishe.appendChild(uiPWishe);
        uiTableRow.appendChild(uiTableCol1Wishe);


        uiTableCol1Cph.className = 'ui-table-col-50';
        uiTableCol1Cph.innerText = "CPH";
        uiTableRow.appendChild(uiTableCol1Cph);
        uiTableCol2Cph.className = 'ui-table-col-50';
        uiSpanCph.innerText = 0;
        uiSpanCph.setAttribute('id', 'metricTaskCph' + metricCard.id);
        uiTableCol2Cph.appendChild(uiSpanCph);
        uiTableRow.appendChild(uiTableCol2Cph);

        uiTableCol1Timeloss.className = 'ui-table-col-100';
        uiPTimeloss.className = 'ui-attention';
        uiPTimeloss.innerHTML = 'We lost <span id="metricTimeloss' + metricCard.id + '">0</span> minutes.';
        uiTableCol1Timeloss.appendChild(uiPTimeloss);
        uiTableRow.appendChild(uiTableCol1Timeloss);

        uiTable.appendChild(uiTableRow);
        uiWhitespace.appendChild(uiTable);
        uiMetricCard.prepend(uiWhitespace);
        
        uiHeading.className = 'heading';
        uiHeading.innerText = metricCard.name;
        // Future addition to check for completion of tasks
        //uiHeadingMarkComplete.id = 'metricMarkComplete' + id;
        //uiHeadingMarkComplete.setAttribute('type', 'checkbox');
        //uiHeadingMarkComplete.setAttribute('value', 1);
        //uiHeading.appendChild(uiHeadingMarkComplete);
        uiHeadingDelete.id = 'metricCardDelete' + metricCard.id;
        uiHeadingDelete.className = 'ui-metric-card-delete';
        uiHeadingDelete.innerHTML = '&#9746;';
        uiHeadingDelete.addEventListener('click', (e) => {
            let l = this.data.metricCards.length;
            for (var i = 0; i < l; i++) {
                if (this.data.metricCards[i] != null) {
                    if (this.data.metricCards[i].id == metricCard.id) {
                        delete this.data.metricCards[i];
                    }
                }
            }
            this.dataSave();
            uiMetricCard.remove();
        });
        uiHeading.appendChild(uiHeadingDelete);
        uiMetricCard.prepend(uiHeading);
        metricCards.prepend(uiMetricCard);
    }
}

(function() {
    let stockMetrics = new StockMetrics();
    stockMetrics.setInteger('metricTotalCases', stockMetrics.data.metricTotalCases);
    stockMetrics.setInteger('metricTaskedAssociates', stockMetrics.data.metricTaskedAssociates);
    stockMetrics.setTime('metricTaskStart', stockMetrics.data.metricTaskStart);
    stockMetrics.setTime('metricTaskEnd', stockMetrics.data.metricTaskEnd);
    //stockMetrics.isChecked('metricTaskLunch');
    stockMetrics.setInteger('metricCphTarget', stockMetrics.data.metricCphTarget);

    document.getElementById('metricAddLocation').addEventListener('click', (event) => {
        let id = Math.random().toString(36).substring(0, 36), // Generating random a random string of letters and numbers.
        name = document.getElementById('metricAddAisle').value;
        let metricCard = {
            "id": id, 
            "name": name,
            "taskCases": 0,
            "taskStart": {"hour": 0, "minute": 0},
            "taskEnd": {"hour": 0, "minute": 0},
            "taskLunch": false
        };
        stockMetrics.addMetricCard(metricCard);
        stockMetrics.data["metricCards"].push(metricCard);
        stockMetrics.dataSave();
        document.getElementById('metricAddAisle').value = '';
    });
    let aisleLen = stockMetrics.data.metricCards.length;
    for (var i = 0; i < aisleLen; i++) {
        if (i in stockMetrics.data.metricCards) {
            if (stockMetrics.data.metricCards[i] != null) {
                stockMetrics.addMetricCard(stockMetrics.data.metricCards[i]);
                stockMetrics.data.metricCards[i] = stockMetrics.updateMetricCard(stockMetrics.data.metricCards[i]);
            }
        }
    }
    document.getElementById('metrics').addEventListener('change', (event) => {
        let totalCases = stockMetrics.getInteger('metricTotalCases'), 
        taskedAssociates = stockMetrics.getInteger('metricTaskedAssociates'), 
        taskStart = stockMetrics.getTime('metricTaskStart'), 
        taskEnd = stockMetrics.getTime('metricTaskEnd'), 
        taskLunch = stockMetrics.isChecked('metricTaskLunch'), 
        cphTarget = stockMetrics.getInteger('metricCphTarget');
        
        stockMetrics.data.metricTotalCases = totalCases;
        stockMetrics.data.metricTaskedAssociates = taskedAssociates;
        stockMetrics.data.metricTaskStart = taskStart;
        stockMetrics.data.metricTaskEnd = taskEnd;
        stockMetrics.data.metricTaskLunch = taskLunch;
        stockMetrics.data.metricCphTarget = cphTarget;
        
        let elapsedMinutes = stockMetrics.getElapsedMinutes(taskStart, taskEnd);
        elapsedMinutes = stockMetrics.lunchElapsedMinutes(elapsedMinutes, taskLunch);
        
        let mpcTarget = 60/cphTarget; // Minutes in one hour divided by the target cases per hour gives the minutes per case.
        let caseProjection = (elapsedMinutes / mpcTarget) * taskedAssociates;
        stockMetrics.setInteger('metricProjectedCases', caseProjection);

        let aisleLen = stockMetrics.data.metricCards.length;
        for (var i = 0; i < aisleLen; i++) {
            stockMetrics.data.metricCards[i] = stockMetrics.updateMetricCard(stockMetrics.data.metricCards[i]);
        }
        stockMetrics.dataSave();
    });
})();