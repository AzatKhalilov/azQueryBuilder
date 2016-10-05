(function (root, factory) {
    if (typeof exports === 'object') {
        // Node, CommonJS-like
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else {
        // Browser globals (root is window)
        root.azQueryBuilder = factory();
    }
})(this, function () {
    angular.module('azQueryBuilder', [])
        .factory('azQueryBuilderCore', azQueryBuilderCore)
        .directive('azQueryBuilder', azQueryBuilder)
        .directive('azQueryBuilderRule', azQueryBuilderRule);

    function createUUID() {
        // http://www.ietf.org/rfc/rfc4122.txt
        var s = [];
        var hexDigits = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
        s[8] = s[13] = s[18] = s[23] = "-";

        return s.join("");
    }

    function format(str, arg) {
        return str.replace(/{(\d+)}/g, function (match, number) {
            return typeof arg[number] != 'undefined'
                ? arg[number]
                : match;
        });
    }



    function valid(rule) {
        return rule.name && rule.operator;
    }

    function parseSql(rule, builder) {
        var condition = '';
        rule.rules.some(function (item, index) {
            if (item.rules && item.rules.length > 0) {
                if (item.rules.length == 1) {
                    condition += parseSql(item);
                } else {
                    condition += "(" + parseSql(item) + ")";
                }
            } else {
                if (!valid(item)) {
                    console.error('Not valid condition');
                    return true;
                }
                var value = Array.isArray(item.value) ? item.value : [item.value];
                condition += item.name + ' ' + sqlOperators[item.operator].operator + ' ' +
                    format(sqlOperators[item.operator].format, value);
            }
            if (index < rule.rules.length - 1) {
                condition += ' ' + rule.condition + ' ';
            }
        });
        return condition
    }

    function findLocation(root, rule) {
        var location = null;
        root.rules.some(function (item, index) {
            if (item == rule) {
                location = {
                    parent: root,
                    index: index
                };
                return true;
            }
            if (item.rules && item.rules.length > 0) {
                location = findLocation(item, rule);
                if (location) {
                    return true;
                }
            }
        });
        return location;
    }

    var sqlOperators = {
        equal: {operator: '=', format: "{0}"},
        not_equal: {operator: '!=', format: '{0}'},
        in: {type: 'in', label: 'in'},
        not_in: {type: 'not_in', label: 'not in'},
        less: {operator: '<', format: '{0}'},
        less_or_equal: {operator: '<=', format: '{0}'},
        greater: {operator: '>', format: '{0}'},
        greater_or_equal: {operator: '>=', format: '{0}'},
        between: {operator: 'BETWEEN', format: '{0} AND {1}'},
        not_between: {type: 'not_between', label: 'not between'},
        begins_with: {type: 'begins_with', label: 'begin with',format: '{0}'},
        not_begins_with: {type: 'not_begins_with', label: 'not begins with'},
        contains: {type: 'contains', label: 'contains'},
        not_contains: {type: 'not_contains', label: 'not contains'},
        ends_with: {type: 'ends_with', label: 'ends with'},
        not_ends_with: {type: 'not_ends_with', label: 'not ends with'},
        is_empty: {type: 'is_empty', label: 'is empty'},
        is_not_empty: {type: 'is_not_empty', label: 'is not empty'},
        is_null: {type: 'is_null', label: 'is null'},
        is_not_null: {type: 'is_not_null', label: 'is not null'}
    };

    var azQueryBuilderClass = function (options) {
        self = this;
        self.defaults = azQueryBuilderClass.DEFAULTS;
        self.rule = options.rule || {
                rules: [],
                condition: self.defaults.defaultCondition
            };
        self.filters = options.filters || [];
        self.filtersByKey = {};
        self.filters.forEach(function (item) {
            self.filtersByKey[item.name] = item;
        });
        self.operators = options.operators || azQueryBuilderClass.OPERATORS;
        self.convertPlugin = {
            sql: parseSql
        };
        if (options.convertPlugin) {
            for (var prop in options.convertPlugin) {
                if (obj.hasOwnProperty(prop)) {
                    self.convertPlugin[prop] = options.convertPlugin[prop];
                }
            }
        }

    };

    azQueryBuilderClass.DEFAULTS = {
        conditions: ['AND', 'OR'],
        defaultCondition: 'AND'
    };

    azQueryBuilderClass.OPERATORS = {
        equal: {type: 'equal', label: '='},
        not_equal: {type: 'not_equal', label: '!='},
        in: {type: 'in', label: 'in'},
        not_in: {type: 'not_in', label: 'not in'},
        less: {type: 'less', label: "<"},
        less_or_equal: {type: 'less_or_equal', label: '<='},
        greater: {type: 'greater', label: '>'},
        greater_or_equal: {type: 'greater_or_equal', label: '>='},
        between: {type: 'between', label: 'between', countValues: 2, separator: 'AND'},
        not_between: {type: 'not_between', label: 'not between', countValues: 2},
        begins_with: {type: 'begins_with', label: 'begin with'},
        not_begins_with: {type: 'not_begins_with', label: 'not begins with'},
        contains: {type: 'contains', label: 'contains'},
        not_contains: {type: 'not_contains', label: 'not contains'},
        ends_with: {type: 'ends_with', label: 'ends with'},
        not_ends_with: {type: 'not_ends_with', label: 'not ends with'},
        is_empty: {type: 'is_empty', label: 'is empty', countValues: 0},
        is_not_empty: {type: 'is_not_empty', label: 'is not empty', countValues: 0},
        is_null: {type: 'is_null', label: 'is null', countValues: 0},
        is_not_null: {type: 'is_not_null', label: 'is not null', countValues: 0}
    };


    azQueryBuilderClass.prototype.addGroup = function (parent) {
        parent.rules.push({
                condition: this.defaults.defaultCondition,
                rules: [],
                isGroup: true
            }
        );
    };

    azQueryBuilderClass.prototype.addRule = function (parent) {
        parent.rules.push({});
    };

    azQueryBuilderClass.prototype.removeRule = function (rule) {
        function recursionRemove(rules) {
            return rules.some(function (item, index) {
                if (item == rule) {
                    rules.splice(index, 1);
                    return true;
                }
                if (item.rules && item.rules.length > 0) {
                    return recursionRemove(item.rules);
                }
            })
        }

        recursionRemove(this.rule.rules);
    };
    azQueryBuilderClass.prototype.insertBefore = function (rule, insertRule) {
        var location = findLocation(this.rule, rule);
        if (location) {
            location.parent.rules.splice(location.index, 0, insertRule);
        }
    };
    azQueryBuilderClass.prototype.insertAfter = function (rule, insertRule) {
        var location = findLocation(this.rule, rule);
        if (location) {
            location.parent.rules.splice(location.index + 1, 0, insertRule);
        }
    };
    azQueryBuilderClass.prototype.getConditionString = function (format) {
        return this.convertPlugin[format].apply(this, [this.rule, this]);
    };
    azQueryBuilderClass.prototype.getConditionSQL = function () {
        return this.getConditionString('sql')
    };


    /**
     *
     *
     */
    azQueryBuilderCore.$inject = [];
    function azQueryBuilderCore() {

    }

    /**
     *
     *
     */
    azQueryBuilder.$inject = [];
    function azQueryBuilder() {
        function getTemplate(element, attrs) {
            return attrs.templateUrl ? attrs.templateUrl : 'src/template/azQueryBuilder.html';
        }

        function QueryBuilderController($scope) {
            var self = this;
            self.queryBuilder = $scope.builder;
            self.draggable = $scope.options.hasOwnProperty('draggable') ? $scope.options.draggable : true;
            self.paddingDrop = $scope.options.hasOwnProperty('paddingDrop') ? $scope.options.paddingDrop : 5;
            self.createImageDrag = $scope.options.hasOwnProperty('createImageDrag') ? $scope.options.createImageDrag : true;
            self.onBeforeRemove = $scope.options.hasOwnProperty('onBeforeRemove') ? $scope.options.onBeforeRemove : function () {
                return true;
            };

            $scope.rule = self.queryBuilder.rule;
            // $scope.queryBuilder = self.queryBuilder;


            self.addGroup = function (parent) {
                self.queryBuilder.addGroup(parent);
            };
            self.addRule = function (parent) {
                self.queryBuilder.addRule(parent);
            };
            self.removeRule = function (rule) {
                if (angular.isFunction(self.onBeforeRemove)) {
                    var result = self.onBeforeRemove(rule);
                    if (typeof result == 'object' && result.then) {
                        result.then(function () {
                            self.queryBuilder.removeRule(rule);
                        });
                        return;
                    }
                    if (typeof result == 'boolean' && result) {
                        self.queryBuilder.removeRule(rule);
                    }
                }
                else {
                    self.queryBuilder.removeRule(rule);
                }
            };

            $scope.addGroup = function () {
                self.addGroup($scope.rule)
            };

            $scope.addRule = function () {
                self.addRule($scope.rule)
            };
            $scope.setCondition = function (condition) {
                $scope.rule.condition = condition;
            };
        }

        function QueryBuilderLink() {

        }

        return {
            restrict: 'E',
            replace: true,
            templateUrl: getTemplate,
            scope: {
                templateUrl: '@',
                options: '=',
                builder: '='
            },
            controller: ['$scope', QueryBuilderController],
            link: QueryBuilderLink
        }
    }

    /**
     *
     *
     */
    azQueryBuilderRule.$inject = [];
    function azQueryBuilderRule() {
        var dragInfo = {
            target: null,
            scope: null,
            rule: null
        };

        function getTemplate(element, attrs) {
            var template = attrs.templateUrl ? attrs.templateUrl : 'src/template/azQueryBuilderRule.html';
            return template;
        }

        function QueryBuilderRuleController($scope) {


        }

        function QueryBuilderRuleLink($scope, $element, $attrs, controller) {

            function topOrBottom(event, targetNode, padding) {
                var mousePointer = event.offsetY;
                var targetSize = targetNode[0].clientHeight;
                var targetPosition = targetNode[0].offsetTop;
                if (mousePointer <= padding) {
                    $element.addClass('dragTop');
                    $element.removeClass('dragBottom');
                    dragInfo.whereDrop = 'previous';
                }
                if (mousePointer >= targetSize - padding) {
                    $element.addClass('dragBottom');
                    $element.removeClass('dragTop');
                    dragInfo.whereDrop = 'next'
                }
            }

            function dropAllowed() {
                if (dragInfo.rule == null) {
                    return false;
                }
                return true
            }

            function changeOperator(operator) {
                $scope.operator = operator ? builderController.queryBuilder.operators[operator] : null;
                $scope.inputs = $scope.operator && $scope.operator.countValues > 0 ? new Array($scope.operator.countValues) : [];
            }

            var builderController = controller[0];
            $scope.queryBuilder = builderController.queryBuilder;


            $scope.addGroup = function () {
                builderController.addGroup($scope.rule);
            };

            $scope.addRule = function () {
                builderController.addRule($scope.rule);
            };

            $scope.removeGroup = function () {
                builderController.removeRule($scope.rule);
            };
            $scope.removeRule = function () {
                builderController.removeRule($scope.rule);
            };
            $scope.changeCondition = function () {
                builderController.changeCondition($scope.rule);
            };
            $scope.setCondition = function (condition) {
                $scope.rule.condition = condition;
            };

            $scope.$watch('rule.operator', function (newVal, oldVal) {
                changeOperator(newVal);
            });


            $element[0].draggable = builderController.draggable;


            $element.on('dragstart', function (e) {
                var event = e.originalEvent || e;
                dragInfo.target = event.target;
                dragInfo.rule = $scope.rule;
                dragInfo.scope = $scope;
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData("Text", '');
                $element.addClass('dragRule');
                if (builderController.createImageDrag) {
                    event.dataTransfer.setDragImage($element[0], 0, 0)
                }
                event.stopPropagation();
            });

            $element.on('dragend', function (e) {
                var event = e.originalEvent || e;
                dragInfo.target = null;
                dragInfo.scope = null;
                dragInfo.currentOverClass = '';
                $element.removeClass('dragTop');
                $element.removeClass('dragBottom');
                $element.removeClass('dragRule');
                event.stopPropagation();
            });

            $element.on('dragenter', function (e) {
                var event = e.originalEvent || e;
                if (!dropAllowed) {
                    return true;
                }
                event.preventDefault();
            });

            $element.on('dragleave', function (e) {
                var event = e.originalEvent || e;
                $element.removeClass('dragTop');
                $element.removeClass('dragBottom');
            });

            $element.on('dragover', function (e) {
                var event = e.originalEvent || e;
                event.stopPropagation();
                event.preventDefault();
                if ($element[0] === dragInfo.target) {
                    return true;
                }
                topOrBottom(event, $element, builderController.paddingDrop);
                return false;
            });

            $element.on('drop', function (e) {
                var event = e.originalEvent || e;
                if (!dropAllowed() || $element[0] === dragInfo.target) {
                    return true;
                }
                event.stopPropagation();
                event.preventDefault();
                dragInfo.currentOverClass = '';
                builderController.queryBuilder.removeRule(dragInfo.rule);
                if (dragInfo.whereDrop == 'previous') {
                    builderController.queryBuilder.insertBefore($scope.rule, dragInfo.rule);
                } else {
                    builderController.queryBuilder.insertAfter($scope.rule, dragInfo.rule);
                }
                $scope.$evalAsync();
                $element.removeClass('dragTop');
                $element.removeClass('dragBottom');
                return false;
            });
        }

        return {
            restrict: 'E',
            require: ['^azQueryBuilder', 'ngModel'],
            replace: true,
            templateUrl: getTemplate,
            scope: {
                templateUrl: '@',
                rule: '=ngModel'
            },
            link: QueryBuilderRuleLink,
            controller: ['$scope', QueryBuilderRuleController]
        }

    }

    return {
        createBuilder: function (options) {
            return new azQueryBuilderClass(options);
        }
    };

});