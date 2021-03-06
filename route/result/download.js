// This file is part of pa11y-dashboard.
// 
// pa11y-dashboard is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// pa11y-dashboard is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with pa11y-dashboard.  If not, see <http://www.gnu.org/licenses/>.

'use strict';

var moment = require('moment');

module.exports = route;

// Route definition
function route (app) {

    function getTaskAndResult (req, res, next) {
        app.webservice.task(req.params.id).get({}, function (err, task) {
            if (err) {
                return next('route');
            }
            app.webservice
                .task(req.params.id)
                .result(req.params.rid)
                .get({full: true}, function (err, result) {
                    if (err) {
                        return next('route');
                    }
                    res.locals.task = task;
                    res.locals.result = result;
                    next();
                });
        });
    }

    function getDownloadFileName (task, result, extension) {
        return [
            'pa11y',
            '--',
            task.url
                .replace(/^https?:\/\//i, '')
                .replace(/\/$/, '')
                .replace(/[^a-z0-9\.\-\_]+/gi, '-'),
            '--',
            task.standard.toLowerCase(),
            '--',
            moment(result.date).format('YYYY-MM-DD'),
            '.',
            extension
        ].join('');
    }

    app.express.get('/:id/:rid.csv', getTaskAndResult, function (req, res) {
        var task = res.locals.task;
        var result = res.locals.result;
        var rows = ['"code","message","type"'];
        result.results.forEach(function (msg) {
            rows.push([
                JSON.stringify(msg.code),
                JSON.stringify(msg.message),
                JSON.stringify(msg.type)
            ].join(','));
        });
        res.attachment(getDownloadFileName(task, result, 'csv'));
        res.send(rows.join('\n'));
    });

    app.express.get('/:id/:rid.json', getTaskAndResult, function (req, res) {
        var task = res.locals.task;
        var result = res.locals.result;
        res.attachment(getDownloadFileName(task, result, 'json'));
        delete task.id;
        delete result.id;
        result.task = task;
        res.send(result);
    });

}
