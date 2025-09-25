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

}
(function() {
    let stockMetrics = new StockMetrics();
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
    });
})();