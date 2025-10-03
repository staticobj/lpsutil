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
                "metricTaskAssociates": 0, 
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
        taskAssociates = this.getInteger('metricTaskAssociates' + metricCard.id),
        taskStart = this.getTime('metricTaskStart' + metricCard.id),
        taskLunch = this.isChecked('metricTaskLunch' + metricCard.id),
        taskEnd = this.getTime('metricTaskEnd' + metricCard.id),
        taskCph = this.getInteger('metricTaskCph' + metricCard.id);
        metricCard.taskCases = taskCases;
        metricCard.taskAssociates = taskAssociates;
        metricCard.taskStart = taskStart;
        metricCard.taskLunch = taskLunch;

        let cphAssoc = cphTarget;
        if (taskAssociates > 1) {
            cphAssoc = cphAssoc * taskAssociates;
        }
        let wisheAllMinutes = (60 / cphAssoc) * taskCases; // Divide the target cases by 60 minutes for the time per case, and multiply by the tasked cases for the total minutes tasked.
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

        //if (taskCph == 0) {// We don't want to update the time the task ends yet.
            // The task may go over the alloted time.
            //this.setTime('metricTaskEnd' + metricCard.id, {'hour' : wisheHour, 'minute' :  wisheMinute});
        //} Reloading the page causes this to overwrite saved times. For the time being we're going to comment it out.
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

        let caseProjection = Math.floor(60 / (elapsedMinutes / taskCases));// Total task minutes divided by the number of cases for the minutes per case. Then divided that by how many minutes are in an hour to get the cases per minute.
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
            uiTableCol1TaskLunch = document.createElement('div'),
            uiTableCol2TaskLunch = document.createElement('div'),
            uiInputTaskLunch = document.createElement('input'), 
            uiTableCol1Wishe = document.createElement('div'),
            uiPWishe = document.createElement('p'),
            uiTableCol1Cph = document.createElement('div'),
            uiTableCol2Cph = document.createElement('div'),
            uiSpanCph = document.createElement('span'),
            uiTableCol1Timeloss = document.createElement('div'),
            uiPTimeloss = document.createElement('p');

        let addRowInput = (id, name, type, value) => {
            let uiTableRow = document.createElement('div'), 
            uiTableCol1 = document.createElement('div'), 
            uiTableCol2 = document.createElement('div'), 
            uiInput = document.createElement('input');
            uiTableRow.className = 'ui-table-row';
            uiTableCol1.className = 'ui-table-col-50';
            uiTableCol1.innerText = name;
            uiTableRow.appendChild(uiTableCol1);
            uiTableCol2.className = 'ui-table-col-50';
            switch(type) {
                case 'number':
                    uiInput.setAttribute('type', 'number');
                    break;
                case 'time':
                    uiInput.setAttribute('type', 'time');
                    uiInput.setAttribute('min', '00:00');
                    uiInput.setAttribute('max', '24:00');
                    value = Math.floor(value.hour).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false}) + ':' + Math.floor(value.minute).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false})
                    break;
            }
            uiInput.setAttribute('value', value);
            uiInput.setAttribute('id', id);
            uiTableCol2.appendChild(uiInput);
            uiTableRow.appendChild(uiTableCol2);
            uiTable.appendChild(uiTableRow);
        };
        uiMetricCard.className = 'ui-metric-card';

        uiWhitespace.className = 'ui-whitespace';
        uiTable.id = 'marked_completed_' + metricCard.id;
        uiTable.className = 'ui-table';
        uiTable.style.opacity = '100%';

        addRowInput('metricCases' + metricCard.id, 'Cases', 'number', metricCard.taskCases);
        addRowInput('metricTaskAssociates' + metricCard.id, 'Task Associates', 'number', metricCard.taskAssociates);
        addRowInput('metricTaskStart' + metricCard.id, 'Task Start', 'time', metricCard.taskStart);
        addRowInput('metricTaskEnd' + metricCard.id, 'Task End', 'time', metricCard.taskEnd);

        
        let uiTableRow1 = document.createElement('div');
        uiTableRow1.className = 'ui-table-row';
        uiTableCol1TaskLunch.className = 'ui-table-col-50';
        uiTableCol1TaskLunch.innerText = "Lunch";
        uiTableRow1.appendChild(uiTableCol1TaskLunch);
        uiTableCol2TaskLunch.className = 'ui-table-col-50';
        uiInputTaskLunch.setAttribute('type', 'checkbox');
        uiInputTaskLunch.setAttribute('value', 1);
        uiInputTaskLunch.checked = metricCard.taskLunch;
        uiInputTaskLunch.setAttribute('id', 'metricTaskLunch' + metricCard.id);
        uiTableCol2TaskLunch.appendChild(uiInputTaskLunch);
        uiTableRow1.appendChild(uiTableCol2TaskLunch);
        uiTable.appendChild(uiTableRow1);
        
        let uiTableRow3 = document.createElement('div');
        uiTableRow3.className = 'ui-table-row';
        uiTableCol1Cph.className = 'ui-table-col-50';
        uiTableCol1Cph.innerText = "CPH";
        uiTableRow3.appendChild(uiTableCol1Cph);
        uiTableCol2Cph.className = 'ui-table-col-50';
        uiSpanCph.innerText = 0;
        uiSpanCph.setAttribute('id', 'metricTaskCph' + metricCard.id);
        uiTableCol2Cph.appendChild(uiSpanCph);
        uiTableRow3.appendChild(uiTableCol2Cph);
        uiTable.appendChild(uiTableRow3);

        uiWhitespace.appendChild(uiTable);
        uiMetricCard.prepend(uiWhitespace);
        
        let uiAttention2 = document.createElement('div');
        uiAttention2.className = 'ui-attention';
        uiPWishe.innerHTML = 'The task should have ended at <span id="metricWishe' + metricCard.id + '">00:00</span>. We lost <span id="metricTimeloss' + metricCard.id + '">0</span> minutes.';
        uiAttention2.appendChild(uiPWishe);
        uiMetricCard.appendChild(uiAttention2);
        
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
    stockMetrics.setInteger('metricTaskAssociates', stockMetrics.data.metricTaskAssociates);
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
            "taskAssociates": 1,
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
        taskAssociates = stockMetrics.getInteger('metricTaskAssociates'), 
        taskStart = stockMetrics.getTime('metricTaskStart'), 
        taskEnd = stockMetrics.getTime('metricTaskEnd'), 
        taskLunch = stockMetrics.isChecked('metricTaskLunch'), 
        cphTarget = stockMetrics.getInteger('metricCphTarget');
        
        stockMetrics.data.metricTotalCases = totalCases;
        stockMetrics.data.metricTaskAssociates = taskAssociates;
        stockMetrics.data.metricTaskStart = taskStart;
        stockMetrics.data.metricTaskEnd = taskEnd;
        stockMetrics.data.metricTaskLunch = taskLunch;
        stockMetrics.data.metricCphTarget = cphTarget;
        
        let elapsedMinutes = stockMetrics.getElapsedMinutes(taskStart, taskEnd);
        elapsedMinutes = stockMetrics.lunchElapsedMinutes(elapsedMinutes, taskLunch);
        
        let mpcTarget = 60/cphTarget; // Minutes in one hour divided by the target cases per hour gives the minutes per case.
        let caseProjection = (elapsedMinutes / mpcTarget) * taskAssociates;
        stockMetrics.setInteger('metricProjectedCases', caseProjection);

        let aisleLen = stockMetrics.data.metricCards.length;
        for (var i = 0; i < aisleLen; i++) {
            if (stockMetrics.data.metricCards[i] != null) {
                stockMetrics.data.metricCards[i] = stockMetrics.updateMetricCard(stockMetrics.data.metricCards[i]);
            }
        }
        stockMetrics.dataSave();
    });
})();