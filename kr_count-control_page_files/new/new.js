/* ==========================================================================
   페이지 초기화
   ========================================================================== */
$(document).ready(function () {
    fnCalcDiffValue();
    fnSetBadgeTotalCount();
    fnBuildStackedGauge();
});


/* ==========================================================================
   탭 전환
   ========================================================================== */
$(document).ready(function () {
    $('.tab.mt30 > li').on('click', function (e) {
        e.preventDefault();

        var target = $(this).data('tab');

        $('.tab.mt30 > li').removeClass('active');
        $(this).addClass('active');

        $('.tab-panel').hide();
        $('.tab-panel[data-panel="' + target + '"]').show();

        if (target === 'buildStatus' && $('#includeBuildStatus').is(':empty')) {
            fnLoadBuildStatus();
        }
    });
});

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
            fnBuildStackedGauge();
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
   build-total-wrap 누적 게이지 + 범례
   ========================================================================== */
// 260715: build-Group-wrap 내 모든 행 데이터 수집
// → 개별 g_bar 색상 지정 + 누적 게이지(build-total-wrap) 색상/비율 반영
function fnBuildStackedGauge() {
    // 항목 순서대로 배정될 색상 팔레트 (필요시 색상값만 조정)
    var colors = [
        '#48cae4', '#0077b6', // 집필+검토 - 집필중, 집필완료
        '#92e6a7', '#208b3a', // 집필+검토 - 검토중, 검토완료
        '#92e6a7', '#208b3a', // 검토 - 검토중, 검토완료
        '#ffb3c6', '#fb6f92'  // 국어원 검토 - 검토중, 검토완료
    ];

    var items = [];
    var colorIndex = 0;

    $('.build-Group-wrap > div').each(function () {
        var groupTitle = $(this).find('.table_title_wrap strong').first().text().trim();

        $(this).find('.stats_board table.graph tbody tr').each(function () {
            var $row = $(this);
            var label = $row.find('th').text().trim();
            var value = fnToNum($row.find('td.num'));
            var color = colors[colorIndex % colors.length];

            // 260715: 개별 board의 g_bar 색상을 누적 게이지와 동일하게 지정
            $row.find('.g_bar').css('background-color', color);

            items.push({
                label: groupTitle + ' - ' + label,
                value: value,
                color: color
            });

            colorIndex++;
        });
    });

    var total = items.reduce(function (sum, item) { return sum + item.value; }, 0);

    var $gauge = $('#totalStackedGauge').empty();
    var $legend = $('#totalGaugeLegend').empty();

    items.forEach(function (item) {
        // 260715: total 대비 비율로 폭 계산 → 항목들 합이 100%라 막대가 꽉 채워짐
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