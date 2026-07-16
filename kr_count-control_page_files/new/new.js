/* ==========================================================================
   페이지 초기화
   ========================================================================== */
$(document).ready(function () {
    fnNormalizeKrStatisticTabs20260716();
    fnPrepareTaskSelectControls20260716();
    fnShowKrStatisticTab20260716($('.tab.mt30 > li.active').data('tab') || 'wordStatus');
    fnSyncSharedGroupData();
    fnCalcDiffValue();
    fnSetBadgeTotalCount();
    fnBuildStackedGauge();
    fnFillGaugeBarByRatio();
});


/* ==========================================================================
   탭 전환
   ========================================================================== */
$(document).ready(function () {
    $('.tab.mt30 > li').off('click').on('click', function (e) {
        e.preventDefault();

        var target = $(this).data('tab');
        fnShowKrStatisticTab20260716(target);

        if (target === 'buildStatus' && $('#includeBuildStatus').is(':empty')) {
            fnLoadBuildStatus();
        }
    });
});

/* ==========================================================================
   2026-07-16: tab panel repair
   ========================================================================== */
function fnNormalizeKrStatisticTabs20260716() {
    var $inner = $('.kr_Statistic .content_area > .inner').first();
    var $tab = $inner.children('.tab.mt30').first();
    var $wordPanel = $('.kr_Statistic .tab-panel[data-panel="wordStatus"]').first();
    var $buildPanel = $('.kr_Statistic .tab-panel[data-panel="buildStatus"]').first();

    if ($inner.length === 0 || $tab.length === 0 || $wordPanel.length === 0) {
        return;
    }

    if ($wordPanel.parent()[0] !== $inner[0]) {
        $wordPanel.insertAfter($tab);
    }

    fnRepairWordStatusInfoBox20260716($wordPanel);

    $inner.children('.table_title_wrap').appendTo($wordPanel);
    $inner.children('#includeWordStatus').appendTo($wordPanel);

    if ($buildPanel.length > 0 && $buildPanel.parent()[0] !== $inner[0]) {
        $buildPanel.insertAfter($wordPanel);
    }
}

function fnRepairWordStatusInfoBox20260716($wordPanel) {
    if ($wordPanel.children('.info_box.violet').length > 0) {
        return;
    }

    var nodes = [];

    $wordPanel.contents().each(function () {
        if (this.nodeType === 3) {
            if ($.trim(this.nodeValue) === 'c') {
                $(this).remove();
            }
            return;
        }

        if (this.nodeType !== 1) {
            return;
        }

        var $node = $(this);

        if ($node.is('.table_title_wrap, #includeWordStatus, .tab-panel')) {
            return false;
        }

        if (!$node.is('script')) {
            nodes.push(this);
        }
    });

    if (nodes.length > 0) {
        $('<div class="info_box violet"></div>').append(nodes).prependTo($wordPanel);
    }
}

function fnShowKrStatisticTab20260716(target) {
    fnNormalizeKrStatisticTabs20260716();

    var $inner = $('.kr_Statistic .content_area > .inner').first();
    var $panels = $inner.children('.tab-panel[data-panel]');
    var $targetPanel = $panels.filter('[data-panel="' + target + '"]');

    if ($targetPanel.length === 0) {
        return;
    }

    $('.tab.mt30 > li').removeClass('active');
    $('.tab.mt30 > li[data-tab="' + target + '"]').addClass('active');

    $panels
        .removeClass('kr-tab-active-20260716')
        .addClass('kr-tab-hidden-20260716')
        .hide();

    $targetPanel
        .removeClass('kr-tab-hidden-20260716')
        .addClass('kr-tab-active-20260716')
        .show();

    $inner.children('.table_title_wrap, #includeWordStatus').toggle(target === 'wordStatus');
}

// 구축통계 데이터 로드
function fnLoadBuildStatus() {
    $.ajax({
        url: '/wordStatus/getBuildStatusList.do',
        type: 'post',
        dataType: 'html',
        beforeSend: function () {
            spin.start();
        },
        success: function (data) {
            $('#includeBuildStatus').html(data);
            fnSyncSharedGroupData();
            fnBuildStackedGauge();
            fnFillGaugeBarByRatio();
        },
        error: function () {
            alert('오류가 발생하였습니다.');
        },
        complete: function () {
            spin.stop();
        }
    });
}


/* ==========================================================================
   상태 라디오 전환 (전체 / 확정 / 확정 수정중)
   ========================================================================== */

// 260716: 상태별 데이터 캐시
// T(전체)는 초기 HTML 값을 그대로 사용, C(확정)/E(확정 수정중)는 T를 임의 비율로 분할
var wordStatusBaseData = null;

$(document).ready(function () {
    $('input[name="wordStatusType"]').on('change', function () {
        var statusType = $(this).val();
        fnLoadWordStatusByType(statusType);
    });
});

// 상태값에 따른 테이블 데이터 갱신
// TODO: 추후 DB 연동 시 이 함수 내부를 ajax 호출로 교체
function fnLoadWordStatusByType(statusType) {
    if (!wordStatusBaseData) {
        var totalData = fnReadCurrentTableData();
        var splitData = fnSplitTableData(totalData);

        wordStatusBaseData = {
            T: totalData,
            C: splitData.C,
            E: splitData.E
        };
    }

    fnRenderTableData(wordStatusBaseData[statusType]);
    fnCalcDiffValue();
    fnSetBadgeTotalCount();
}

// 현재 DOM(초기 렌더링된 값)을 그대로 읽어서 T 데이터로 사용
function fnReadCurrentTableData() {
    var rows = [];

    $('.table_wrap tbody tr').each(function () {
        var rowValues = [];
        var $cells = $(this).find('td.col-data');

        for (var i = 0; i <= 5; i++) {
            rowValues.push(fnToNum($cells.eq(i)));
        }
        rows.push(rowValues);
    });

    return rows;
}

// 260716: 임시 랜덤 분할 (DB 연동 전까지 사용)
// T값을 임의 비율(30~70%)로 C/E로 분할 (C + E = T 항상 보장)
function fnSplitTableData(totalData) {
    var dataC = [];
    var dataE = [];

    for (var r = 0; r < totalData.length; r++) {
        var rowC = [];
        var rowE = [];

        for (var c = 0; c < totalData[r].length; c++) {
            var total = totalData[r][c];
            var ratio = Math.random() * 0.4 + 0.3;
            var cVal = Math.round(total * ratio);
            var eVal = total - cVal;

            rowC.push(cVal);
            rowE.push(eVal);
        }

        dataC.push(rowC);
        dataE.push(rowE);
    }

    return { C: dataC, E: dataE };
}

// 데이터를 테이블에 반영
function fnRenderTableData(rows) {
    $('.table_wrap tbody tr').each(function (rowIndex) {
        var $cells = $(this).find('td.col-data');
        var rowValues = rows[rowIndex];

        for (var i = 0; i <= 5; i++) {
            $cells.eq(i).text(rowValues[i].toLocaleString());
        }
    });
}


/* ==========================================================================
   구축-온용어 차이값 계산 및 색상 클래스 적용
   ========================================================================== */
function fnCalcDiffValue() {
    $('.table_wrap tbody tr').each(function () {
        var $cells = $(this).find('td.col-data');

        // 구축
        var buildTotal = fnToNum($cells.eq(0));
        var buildExpose = fnToNum($cells.eq(1));
        var buildNonExpose = fnToNum($cells.eq(2));

        // 온용어
        var onTotal = fnToNum($cells.eq(3));
        var onExpose = fnToNum($cells.eq(4));
        var onNonExpose = fnToNum($cells.eq(5));

        // 차이
        fnSetDiffCell($cells.eq(6), buildTotal - onTotal);
        fnSetDiffCell($cells.eq(7), buildExpose - onExpose);
        fnSetDiffCell($cells.eq(8), buildNonExpose - onNonExpose);
    });
}

// 차이값 텍스트 및 색상 클래스 세팅
function fnSetDiffCell($cell, value) {
    $cell.text(value.toLocaleString());
    $cell.removeClass('red green');

    if (value < 0) {
        $cell.addClass('red');
    } else if (value > 0) {
        $cell.addClass('green');
    }
}


/* ==========================================================================
   graph 영역 total 건수 → badge-count 표출
   ========================================================================== */
function fnSetBadgeTotalCount() {
    $('.stats_board').each(function () {
        var $badge = $(this).parent().find('.badge-count');

        var total = 0;
        $(this).find('table.graph td.num').each(function () {
            total += fnToNum($(this));
        });

        $badge.text(total.toLocaleString() + '건');
    });
}


/* ==========================================================================
   build-Group-wrap 공유 데이터 동기화
   ========================================================================== */
// 260716: "검토" board의 검토중/검토완료 값을 원본으로 보고
// "집필 + 검토" board의 동일 라벨(검토중/검토완료) 값을 그대로 맞춰줌
// (국어원 검토 board는 별개 데이터라 대상에서 제외)
function fnSyncSharedGroupData() {
    var $boards = $('.build-Group-wrap > div');

    var $sourceBoard = $boards.filter(function () {
        return $(this).find('.table_title_wrap strong').first().text().trim() === '검토';
    }).find('.stats_board');

    var $targetBoard = $boards.filter(function () {
        return $(this).find('.table_title_wrap strong').first().text().trim() === '집필 + 검토';
    }).find('.stats_board');

    if ($sourceBoard.length === 0 || $targetBoard.length === 0) return;

    ['검토중', '검토완료'].forEach(function (label) {
        var $sourceRow = $sourceBoard.find('table.graph tbody tr').filter(function () {
            return $(this).find('th').text().trim() === label;
        });

        var $targetRow = $targetBoard.find('table.graph tbody tr').filter(function () {
            return $(this).find('th').text().trim() === label;
        });

        if ($sourceRow.length === 0 || $targetRow.length === 0) return;

        var sourceValue = fnToNum($sourceRow.find('td.num'));

        $targetRow.find('td.num').text(sourceValue.toLocaleString() + '건');
    });
}


/* ==========================================================================
   build-Group-wrap 개별 게이지 바 비율 채우기
   ========================================================================== */
// 260716: 각 stats_board 안의 num 합계를 100%로 보고 g_bar 너비를 비율대로 채움
function fnFillGaugeBarByRatio() {
    $('.build-Group-wrap .stats_board').each(function () {
        var $rows = $(this).find('table.graph tbody tr');

        // 1) 해당 board 내 num 합계 구하기
        var total = 0;
        $rows.each(function () {
            total += fnToNum($(this).find('td.num'));
        });

        // 2) 각 행의 비율만큼 g_bar 너비 세팅
        $rows.each(function () {
            var value = fnToNum($(this).find('td.num'));
            var percent = total > 0 ? (value / total * 100) : 0;

            $(this).find('.g_bar').css('width', percent + '%');
        });
    });
}


/* ==========================================================================
   build-total-wrap 누적 게이지 + 범례
   ========================================================================== */
// build-Group-wrap 내 모든 행 데이터 수집
function fnBuildStackedGauge() {
    var colors = [
        '#98cbf5 ', '#023e8a ', // 집필+검토 - 집필중, 집필완료
        '#9eeccc ', '#0f9d5c ', // 검토중, 검토완료 (공유 데이터, 한 번만 표시)
        '#f8ce85 ', '#e77728 '  // 국어원 검토 - 검토중, 검토완료
    ];

    var items = [];
    var colorIndex = 0;
    var seenSharedLabels = {};

    $('.build-Group-wrap > div').each(function () {
        var groupTitle = $(this).find('.table_title_wrap strong').first().text().trim();
        var isSharedGroup = (groupTitle === '집필 + 검토' || groupTitle === '검토');

        $(this).find('.stats_board table.graph tbody tr').each(function () {
            var $row = $(this);
            var label = $row.find('th').text().trim();
            var value = fnToNum($row.find('td.num'));

            var isSharedLabel = isSharedGroup && (label === '검토중' || label === '검토완료');

            if (isSharedLabel) {
                if (seenSharedLabels[label]) {
                    $row.find('.g_bar').css('background-color', seenSharedLabels[label].color);
                    return;
                }
            }

            var color = colors[colorIndex % colors.length];
            $row.find('.g_bar').css('background-color', color);
            colorIndex++;

            var displayLabel = isSharedLabel ? label : (groupTitle + ' - ' + label);

            items.push({
                label: displayLabel,
                value: value,
                color: color
            });

            if (isSharedLabel) {
                seenSharedLabels[label] = { color: color };
            }
        });
    });

    var total = items.reduce(function (sum, item) { return sum + item.value; }, 0);

    var $gauge = $('#totalStackedGauge').empty();
    var $legend = $('#totalGaugeLegend').empty();

    items.forEach(function (item) {
        // total 대비 비율로 폭 계산
        var percent = total > 0 ? (item.value / total * 100) : 0;

        $gauge.append(
            $('<div class="segment"></div>')
                .css({ width: percent + '%', backgroundColor: item.color })
        );

        $legend.append(
            $('<li></li>').append(
                $('<span class="legend-color"></span>').css('background-color', item.color),
                $('<span></span>').text(item.label)
            )
        );
    });

    $('.build-total-wrap .m_tit .black9').text('[ 총 ' + total.toLocaleString() + '건 ]');
}

/* ==========================================================================
   공통 유틸
   ========================================================================== */
// 셀 텍스트 → 숫자 변환 (콤마 제거)
function fnToNum($cell) {
    return parseFloat($cell.text().trim().replace(/,/g, '')) || 0;
}

/* ==========================================================================
   2026-07-16: wordStatus task select
   ========================================================================== */
$(document).ready(function () {
    fnPrepareTaskSelectControls20260716();
});

function fnPrepareTaskSelectControls20260716() {
    fnMarkTaskSelectFilters20260716();
    fnApplyTaskSelect2Style20260716();
}

function fnAddWordStatusTaskSelect20260716() {
    return;

    var $infoBox = $('.kr_Statistic .tab-panel[data-panel="wordStatus"] .info_box.violet').first();

    if ($infoBox.length === 0 || $('#taskList').length > 0) {
        return;
    }

    var taskItems = [
        { value: '0', text: '0_\uC804\uCCB4\uACFC\uC81C' },
        { value: '-2', text: '1_\uAE30\uBCF8\uACFC\uC81C' },
        { value: '75', text: '2015-2019 \uAD6C\uCD95*\uB0A8\uBD81 \uC804\uBB38 \uC6A9\uC5B4*\uC5B4\uBB38\uC5F0\uAD6C\uACFC' }
    ];

    var $filter = $('<div class="word-status-task-filter kr-task-select-filter-20260716"></div>');
    var $label = $('<strong class="black1 mr30"></strong>').append(
        $('<label for="taskList"></label>').text('\uACFC\uC81C')
    );
    var $selectWrap = $('<div class="select w400"></div>');
    var $select = $('<select id="taskList" name="taskNo"></select>');

    for (var i = 0; i < taskItems.length; i++) {
        $select.append(
            $('<option></option>')
                .val(taskItems[i].value)
                .text(taskItems[i].text)
        );
    }

    $selectWrap.append($select);
    $filter.append($label, $selectWrap);
    $infoBox.prepend($filter);
}

function fnMarkTaskSelectFilters20260716() {
    $('#deptList').closest('.info_box.violet > div').addClass('kr-task-select-filter-20260716');
}

function fnApplyTaskSelect2Style20260716() {
    if (!$.fn.select2) {
        return;
    }

    $('#deptList').each(function () {
        var $select = $(this);

        if ($select.data('select2')) {
            return;
        }

        $select.select2({
            width: '400px',
            minimumResultsForSearch: Infinity
        });
    });
}
