module.exports.sql
    = ' CREATE OR REPLACE VIEW test_stats AS'
    + ' WITH'
    + ' max_student_scores AS ('
    + '     SELECT'
    + '         last_value(t.id)           OVER (PARTITION BY t.id, u.id ORDER BY tsc.score_perc, tsc.date, tsc.id) AS id,'
    + '         last_value(tsc.score_perc) OVER (PARTITION BY t.id, u.id ORDER BY tsc.score_perc, tsc.date, tsc.id) AS score_perc'
    + '     FROM test_scores AS tsc'
    + '     JOIN test_instances AS ti ON (ti.id = tsc.test_instance_id)'
    + '     JOIN tests AS t ON (t.id = ti.test_id)'
    + '     JOIN users AS u ON (u.id = ti.user_id)'
    + '     JOIN enrollments AS e ON (e.user_id = u.id)'
    + '     AND t.deleted_at IS NULL'
    + '     AND e.role = \'Student\''
    + ' ),'
    + ' stats_from_data AS ('
    + '     SELECT'
    + '         id,'
    + '         count(score_perc) AS number,'
    + '         min(score_perc) AS min,'
    + '         max(score_perc) AS max,'
    + '         round(avg(score_perc)) AS mean,'
    + '         round(stddev_samp(score_perc)) AS std,'
    + '         percentile_disc(0.5) WITHIN GROUP (ORDER BY score_perc) AS median,'
    + '         count(score_perc <= 0 OR NULL) AS n_zero,'
    + '         count(score_perc >= 100 OR NULL) AS n_hundred,'
    + '         round(CAST(count(score_perc <= 0 OR NULL) AS double precision) / count(score_perc) * 100) AS n_zero_perc,'
    + '         round(CAST(count(score_perc >= 100 OR NULL) AS double precision) / count(score_perc) * 100) AS n_hundred_perc,'
    + '         histogram(score_perc, 0, 100, 10) AS score_hist'
    + '     FROM max_student_scores'
    + '     GROUP BY id'
    + ' ),'
    + ' zero_stats AS ('
    + '     SELECT'
    + '         id,'
    + '         0 AS number,'
    + '         0 AS min,'
    + '         0 AS max,'
    + '         0 AS mean,'
    + '         0 AS std,'
    + '         0 AS median,'
    + '         0 AS n_zero,'
    + '         0 AS n_hundred,'
    + '         0 AS n_zero_perc,'
    + '         0 AS n_hundred_perc,'
    + '         array_fill(0, ARRAY[10]) AS score_hist'
    + '     FROM tests AS t'
    + '     WHERE NOT EXISTS ('
    + '         SELECT * FROM stats_from_data WHERE stats_from_data.id = t.id'
    + '     )'
    + ' )'
    + ' SELECT * FROM stats_from_data'
    + ' UNION'
    + ' SELECT * FROM zero_stats'
    + ' ;'
