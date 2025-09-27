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
        if (element.checked) {
            return true;
        }
        return false;
    }
}
class StockMetrics extends ElementDataAccess {
    aisleDataChange(id) {
        let cphTarget = this.getInteger('metricCphTarget'), 
        taskCases = this.getInteger('metricCases' + id),
        taskStart = this.getTime('metricTaskStart' + id),
        taskLunch = this.isChecked('metricTaskLunch' + id),
        taskEnd = this.getTime('metricTaskEnd' + id),
        taskCph = this.getInteger('metricTaskCph' + id);  

        let wisheAllMinutes = (60 / cphTarget) * taskCases; // Divide the target cases by 60 minutes for the time per case, and multiply by the tasked cases for the total minutes tasked.
        if (taskLunch) {
            if (wisheAllMinutes > 60) {
                wisheAllMinutes -= 60;// We're going to take away X minutes for lunch, but only if we have more than X minutes tasked.
            }
        }
        if (wisheAllMinutes < 0) {
            wisheAllMinutes = 0;
        }
        wisheAllMinutes += taskStart.minute;
        let wisheHour = Math.floor(taskStart.hour + (wisheAllMinutes / 60)).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false}), 
        wisheMinute = Math.floor(wisheAllMinutes % 60).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false});
        
        this.setTime('metricWishe' + id, {'hour' : wisheHour, 'minute' :  wisheMinute});

        if (taskCph == 0) {// We don't want to update the time the task ends yet.
            // The task may go over the alloted time.
            this.setTime('metricTaskEnd' + id, {'hour' : wisheHour, 'minute' :  wisheMinute});
        }
        taskEnd = this.getTime('metricTaskEnd' + id);

        let totalAllMinutes = 0, 
        allHours = taskEnd.hour - taskStart.hour, // The hours we have tasked without a lunch.
        allMinutes = taskEnd.minute - taskStart.minute;// Minutes we have after the last hour.
        totalAllMinutes += allMinutes;
        if (allHours > 0) {
            totalAllMinutes += allHours * 60;
        }
        if (taskLunch) {
            if (totalAllMinutes > 60) {
                totalAllMinutes -= 60;// We're going to take away X minutes for lunch, but only if we have more than X minutes tasked.
            }
        }
        if (totalAllMinutes < 0) {
            totalAllMinutes = 0;
        }
        
        let aisleTimeloss = totalAllMinutes - wisheAllMinutes;
        this.setInteger('metricTimeloss' + id, aisleTimeloss);

        let caseProjection = Math.ceil(60 / (totalAllMinutes / taskCases));// Total task minutes divided by the number of cases for the minutes per case. Then divided that by how many minutes are in an hour to get the cases per minute.
        this.setInteger('metricTaskCph' + id, caseProjection);
    }
    aisleAddLocation(id, name) {
        let listAisles = document.getElementById('metricAisles');
        let uiHeading = document.createElement('h2'),
            uiHeadingMarkComplete = document.createElement('input'),
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

        uiWhitespace.className = 'ui-whitespace';
        uiTable.id = 'marked_completed_' + id;
        uiTable.className = 'ui-uiTable';
        uiTable.style.opacity = '100%';
        uiTableRow.className = 'ui-table-row';

        uiTableCol1Cases.className = 'ui-table-col-50';
        uiTableCol1Cases.innerText = 'Cases';
        uiTableRow.appendChild(uiTableCol1Cases);
        uiTableCol2Cases.className = 'ui-table-col-50';
        uiInputTaskCases.setAttribute('type', 'number');
        uiInputTaskCases.setAttribute('value', 0);
        uiInputTaskCases.setAttribute('id', 'metricCases' + id);
        uiTableCol2Cases.appendChild(uiInputTaskCases);
        uiTableRow.appendChild(uiTableCol2Cases);

        uiTableCol1TaskStart.className = 'ui-table-col-50';
        uiTableCol1TaskStart.innerText = "Task Start";
        uiTableRow.appendChild(uiTableCol1TaskStart);
        uiTableCol2TaskStart.className = 'ui-table-col-50';
        uiInputTaskStart.setAttribute('type', 'time');
        uiInputTaskStart.setAttribute('min', '00:00');
        uiInputTaskStart.setAttribute('max', '24:00');
        uiInputTaskStart.setAttribute('value', '00:00');
        uiInputTaskStart.setAttribute('id', 'metricTaskStart' + id);
        uiTableCol2TaskStart.appendChild(uiInputTaskStart);
        uiTableRow.appendChild(uiTableCol2TaskStart);

        uiTableCol1TaskLunch.className = 'ui-table-col-50';
        uiTableCol1TaskLunch.innerText = "Lunch";
        uiTableRow.appendChild(uiTableCol1TaskLunch);
        uiTableCol2TaskLunch.className = 'ui-table-col-50';
        uiInputTaskLunch.setAttribute('type', 'checkbox');
        uiInputTaskLunch.setAttribute('value', 1);
        uiInputTaskLunch.setAttribute('id', 'metricTaskLunch' + id);
        uiTableCol2TaskLunch.appendChild(uiInputTaskLunch);
        uiTableRow.appendChild(uiTableCol2TaskLunch);

        uiTableCol1TaskEnd.className = 'ui-table-col-50';
        uiTableCol1TaskEnd.innerText = "Task End";
        uiTableRow.appendChild(uiTableCol1TaskEnd);
        uiTableCol2TaskEnd.className = 'ui-table-col-50';
        uiInputTaskEnd.setAttribute('type', 'time');
        uiInputTaskEnd.setAttribute('min', '00:00');
        uiInputTaskEnd.setAttribute('max', '24:00');
        uiInputTaskEnd.setAttribute('value', '00:00');
        uiInputTaskEnd.setAttribute('id', 'metricTaskEnd' + id);
        uiTableCol2TaskEnd.appendChild(uiInputTaskEnd);
        uiTableRow.appendChild(uiTableCol2TaskEnd);

        uiTableCol1Wishe.className = 'ui-table-col-100';
        uiPWishe.className = 'ui-attention';
        uiPWishe.innerText = 'When it should have ended: ';
        uiPWishe.innerHTML += '<span id="metricWishe' + id + '">00:00</span>';
        uiTableCol1Wishe.appendChild(uiPWishe);
        uiTableRow.appendChild(uiTableCol1Wishe);


        uiTableCol1Cph.className = 'ui-table-col-50';
        uiTableCol1Cph.innerText = "CPH";
        uiTableRow.appendChild(uiTableCol1Cph);
        uiTableCol2Cph.className = 'ui-table-col-50';
        uiSpanCph.innerText = 0;
        uiSpanCph.setAttribute('id', 'metricTaskCph' + id);
        uiTableCol2Cph.appendChild(uiSpanCph);
        uiTableRow.appendChild(uiTableCol2Cph);

        uiTableCol1Timeloss.className = 'ui-table-col-100 ui-attention';
        uiPTimeloss.className = 'ui-attention';
        uiPTimeloss.innerHTML = 'We lost <span id="metricTimeloss' + id + '">0</span> minutes.';
        uiTableCol1Timeloss.appendChild(uiPTimeloss);
        uiTableRow.appendChild(uiTableCol1Timeloss);

        uiTable.appendChild(uiTableRow);
        uiWhitespace.appendChild(uiTable);
        listAisles.prepend(uiWhitespace);
        
        uiHeading.className = 'heading';
        uiHeading.innerText = name;
        uiHeadingMarkComplete.id = 'metricMarkComplete' + id;
        uiHeadingMarkComplete.setAttribute('type', 'checkbox');
        uiHeadingMarkComplete.setAttribute('value', 1);
        uiHeading.appendChild(uiHeadingMarkComplete);
        listAisles.prepend(uiHeading);
    }
}

(function() {
    const appSession = {"aisles": []};

    let stockMetrics = new StockMetrics();

    document.getElementById('metricAddLocation').addEventListener('click', (event) => {
        let id = Math.random().toString(36).substring(0, 36), // Generating random a random string of letters and numbers.
        name = document.getElementById('metricAddAisle').value;
        stockMetrics.aisleAddLocation(id, name);
        appSession["aisles"].push({
            "id": id, 
            "name": name
        });
    });
    document.getElementById('metrics').addEventListener('change', (event) => {
        let taskedAssociates = stockMetrics.getInteger('metricTaskedAssociates'), 
        taskStart = stockMetrics.getTime('metricTaskStart'), 
        taskEnd = stockMetrics.getTime('metricTaskEnd'), 
        taskLunch = stockMetrics.isChecked('metricTaskLunch'), 
        cphTarget = stockMetrics.getInteger('metricCphTarget');
        let totalAllMinutes = 0, 
        allHours = taskEnd.hour - taskStart.hour, // The hours we have tasked without a lunch.
        allMinutes = taskEnd.minute;// Minutes we have after the last hour.
        if (taskStart.minute > 0) {
            totalAllMinutes += 60 - taskStart.minute;// Minutes remaining in the first hour.
            if (allHours > 0) {
                allHours--;
            }
        }
        totalAllMinutes += allMinutes;
        if (allHours > 0) {
            totalAllMinutes += allHours * 60;
        }
        if (taskLunch) {
            if (totalAllMinutes > 60) {
                totalAllMinutes -= 60;// We're going to take away X minutes for lunch, but only if we have more than X minutes tasked.
            }
        }
        let mpcTarget = 60/cphTarget; // Minutes in one hour divided by the target cases per hour gives the minutes per case.
        let caseProjection = (totalAllMinutes / mpcTarget) * taskedAssociates;
        stockMetrics.setInteger('metricProjectedCases', caseProjection);

        let aisleLen = appSession.aisles.length;
        for (var i = 0; i < aisleLen; i++) {
            stockMetrics.aisleDataChange(appSession.aisles[i].id);
        }
    });
})();