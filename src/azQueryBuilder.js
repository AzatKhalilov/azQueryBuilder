(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(factory);
    } else if (typeof exports === 'object') {
        // Node, CommonJS-like
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.returnExports = factory();
    }
})(this, function () {
    angular.module('azQueryBuilderModule', [])
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

    var azQueryBuilderClass = function (options) {

        // function(){}


        self = this;
        var dragObject = {
            data: null,
            src: null,
            placeholder: null,
            display: null
        };
        self.rules = options.rules || [];
        self.defaults = azQueryBuilderClass.DEFAULTS;
        self.condition = self.defaults.defaultCondition;
        self.filters = options.filters || [];
        self.filtersByKey = {};
        options.filters.forEach(function (item) {
            self.filtersByKey[item.name] = item;
        });
        self.operators = options.operators || azQueryBuilderClass.OPERATORS;
        self.draggable = options.hasOwnProperty('draggable') ? options.draggable : true;


        self.setDraggable = function (el, data) {
            if (!self.draggable) return;
            el.draggable = true;
            el.addEventListener(
                'dragstart',
                function (e) {
                    var event = e.originalEvent || e;
                    event.dataTransfer.effectAllowed = 'move';
                    dragObject.src = this;
                    dragObject.data = data;
                    //for Chrome. Because placeholder invisible if you hide an element immediately
                    // setTimeout(function(){
                    //     dragObject.placeholder = el.cloneNode();
                    //     dragObject.placeholder.innerHTML = '&nbsp';
                    //     dragObject.placeholder.className ="rule-placeholder";
                    //     dragObject.placeholder.style.minHeight = el.style.height;
                    //     dragObject.display = el.style.display;
                    //     el.insertBefore(dragObject.placeholder,el);
                    //     // el.style.display ='none';
                    //     console.log(el.parentNode)
                    // },0);
                    event.stopPropagation();
                    // this.classList.add('drag');
                    return false;
                },
                false
            );
            el.addEventListener(
                'dragend',
                function (e) {
                    var event = e.originalEvent || e;
                    // el.parentNode.removeChild(dragObject.placeholder);
                    // // el.style.display =dragObject.display;
                    // dragObject.src = null;
                    // dragObject.data = null;
                    // dragObject.placeholder = null;

                    // this.classList.remove('drag');
                    event.stopPropagation();
                    return false;
                },
                false
            );
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
        between: {type: 'between', label: 'between'},
        not_between: {type: 'not_between', label: 'not between'},
        begins_with: {type: 'begins_with', label: 'begin with'},
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


    azQueryBuilderClass.prototype.addGroup = function (parent) {
        parent.rules.push({
                parent: parent,
                id: createUUID(),
                condition: this.defaults.defaultCondition,
                rules: [],
                isGroup: true
            }
        );
    };

    azQueryBuilderClass.prototype.addRule = function (parent) {
        parent.rules.push({parent: parent, id: createUUID()});
    };

    azQueryBuilderClass.prototype.removeRule = function (rule) {
        rule.parent.rules.some(function (item, index) {
            if (item == rule) {
                rule.parent.rules.splice(index, 1);
                return true;
            }
        })
    };

    azQueryBuilderClass.prototype.changeCondition = function (group) {

    };


    azQueryBuilderClass.prototype.setDraggable = function (element, rule) {

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
            self.queryBuilder = new azQueryBuilderClass($scope.options);
            $scope.queryBuilder = self.queryBuilder;
            $scope.rules = self.queryBuilder.rules;

            self.addGroup = function (parent) {
                self.queryBuilder.addGroup(parent)
            };
            self.addRule = function (parent) {
                self.queryBuilder.addRule(parent);
            };

            self.removeRule = function (rule) {
                self.queryBuilder.removeRule(rule)
            };


            $scope.addGroup = function () {
                self.addGroup($scope)
            };

            $scope.addRule = function () {
                self.addRule($scope)
            }

        }

        function QueryBuilderLink() {

        }

        return {
            restrict: 'E',
            templateUrl: getTemplate,
            scope: {
                templateUrl: '@',
                options: '='
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
        function getTemplate(element, attrs) {
            var template = attrs.templateUrl ? attrs.templateUrl : 'src/template/azQueryBuilderRule.html';
            return template;
        }

        function QueryBuilderRuleController($scope) {


        }

        function QueryBuilderRuleLink($scope, $element, $attrs, controller) {
            var builderController = controller[0];
            $scope.queryBuilder = builderController.queryBuilder;
            $scope.rules = $scope.rule.rules;
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

            // builderController.queryBuilder.setDraggable($element[0],$scope.rule);
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
});